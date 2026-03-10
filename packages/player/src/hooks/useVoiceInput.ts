'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Web Speech API type shim
// ---------------------------------------------------------------------------
// The Web Speech API types are not included in the default TypeScript DOM
// lib, and availability varies across browsers (prefixed in WebKit).  We
// declare just enough surface area to satisfy our usage.

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface VoiceInputState {
  /** Whether the microphone is actively listening. */
  isListening: boolean;
  /** The most recently recognised transcript. */
  transcript: string;
  /** Begin listening for a single utterance. */
  startListening: () => void;
  /** Stop listening immediately. */
  stopListening: () => void;
  /** Human-readable error string, or `null`. */
  error: string | null;
  /** `false` when the Web Speech API is not available in this browser. */
  isSupported: boolean;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | SpeechRecognitionConstructor
    | null;
}

/**
 * Provides push-to-talk voice input via the Web Speech API.
 *
 * - Single-utterance mode (`continuous = false`).
 * - Language fixed to `en-US`.
 * - Automatically cleans up on unmount.
 */
export function useVoiceInput(): VoiceInputState {
  const SpeechRecognition = getSpeechRecognitionCtor();
  const isSupported = SpeechRecognition !== null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Persist the recognition instance across renders so we can stop it later.
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Track whether the component is still mounted to avoid state updates after
  // unmount (the recognition callbacks are async).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // startListening
  // ---------------------------------------------------------------------------
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;

    // If a previous instance is still around, abort it first.
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!mountedRef.current) return;
      const result = event.results[event.resultIndex];
      if (result?.[0]) {
        setTranscript(result[0].transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!mountedRef.current) return;
      // "aborted" is not a real error — it happens when we call stop/abort.
      if (event.error !== 'aborted') {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);

    try {
      recognition.start();
    } catch (err) {
      // start() can throw if called while already started.
      setIsListening(false);
      setError(err instanceof Error ? err.message : 'Failed to start recognition');
    }
  }, [SpeechRecognition]);

  // ---------------------------------------------------------------------------
  // stopListening
  // ---------------------------------------------------------------------------
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // The `onend` callback will set isListening to false and clear the ref.
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported,
  };
}
