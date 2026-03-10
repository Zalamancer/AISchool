'use client';

import {useState, useCallback, useRef} from 'react';
import type {AnimationTimeline} from '../types/animation';

export interface SolutionStep {
  title: string;
  content: string;
}

export interface Solution {
  steps: SolutionStep[];
  concepts: string[];
  animation?: AnimationTimeline;
}

export function useProblemSolver() {
  const [solution, setSolution] = useState<Solution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const solve = useCallback(
    async (problem: string, imageBase64?: string, imageMediaType?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setSolution(null);

      try {
        const res = await fetch('/api/solve', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({problem, imageBase64, imageMediaType}),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as {error?: string}).error ?? `Request failed with status ${res.status}`,
          );
        }

        const data = (await res.json()) as Solution;
        setSolution(data);
        return data;
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return null;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {solve, solution, isLoading, error};
}
