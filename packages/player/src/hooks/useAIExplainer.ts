'use client';

import { useState, useCallback, useRef } from 'react';

export interface ExplainContext {
  lessonTitle: string;
  chapterTitle: string;
  concepts: string[];
  lastNarration: string;
}

interface UseAIExplainerConfig {
  apiEndpoint?: string;
}

interface UseAIExplainerReturn {
  ask: (question: string, context: ExplainContext) => Promise<string>;
  response: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Claude API integration.
 * Sends student questions with lesson context to the /api/explain route
 * and manages loading / error state.
 */
export function useAIExplainer(
  config: UseAIExplainerConfig = {},
): UseAIExplainerReturn {
  const { apiEndpoint = '/api/explain' } = config;

  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abort controller ref so we can cancel in-flight requests when a new one
  // comes in or the component unmounts.
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(
    async (question: string, context: ExplainContext): Promise<string> => {
      // Cancel any pending request.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setResponse(null);

      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, context }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ??
              `Request failed with status ${res.status}`,
          );
        }

        const data = (await res.json()) as { answer: string };
        setResponse(data.answer);
        return data.answer;
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          // Silently ignore aborted requests.
          return '';
        }
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint],
  );

  return { ask, response, isLoading, error };
}
