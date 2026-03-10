'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Chapter, NarrationSegment } from '@/types/lesson';

export interface SceneState {
  /** Current playback time in seconds. */
  currentTime: number;
  /** The chapter that spans the current playback time, or `null` before the first chapter. */
  currentChapter: Chapter | null;
  /** Index of the current chapter within the chapters array, or -1 if none. */
  currentChapterIndex: number;
  /** Concepts covered by the current chapter. */
  currentConcepts: string[];
  /** Most recent narration segment whose start time is at or before the current time. */
  lastNarration: NarrationSegment | null;
  /** Whether the video is currently playing. */
  isPlaying: boolean;
  /** Seek the video to the given time in seconds. */
  seekTo: (seconds: number) => void;
  /** Start playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Toggle between play and pause. */
  toggle: () => void;
}

/**
 * Tracks the playback state of a `<video>` element and derives scene-level
 * information such as the current chapter, active concepts, and most recent
 * narration segment.
 *
 * @param videoRef - React ref attached to the `<video>` element.
 * @param chapters - Ordered array of chapter markers (sorted by `startSeconds`).
 * @param narrationSegments - Ordered array of narration cues (sorted by `start`).
 */
export function useSceneState(
  videoRef: RefObject<HTMLVideoElement | null>,
  chapters: Chapter[],
  narrationSegments: NarrationSegment[] = [],
): SceneState {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep a stable reference to narration segments for binary search lookups
  // without causing effect re-runs when the identity of the array changes but
  // its contents stay the same.
  const narrationRef = useRef(narrationSegments);
  narrationRef.current = narrationSegments;

  // ---------------------------------------------------------------------------
  // Video element event listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Sync initial state in case the video is already playing when the hook
    // mounts (e.g. after a hot-module reload).
    setCurrentTime(video.currentTime);
    setIsPlaying(!video.paused);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef]);

  // ---------------------------------------------------------------------------
  // Derived chapter information
  // ---------------------------------------------------------------------------
  const { currentChapter, currentChapterIndex } = useMemo(() => {
    // Walk backwards through the chapters array to find the last chapter whose
    // startSeconds is at or before the current playback time.
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTime >= chapters[i].startSeconds) {
        return { currentChapter: chapters[i], currentChapterIndex: i };
      }
    }
    return { currentChapter: null, currentChapterIndex: -1 };
  }, [chapters, currentTime]);

  const currentConcepts = useMemo(
    () => currentChapter?.concepts ?? [],
    [currentChapter],
  );

  // ---------------------------------------------------------------------------
  // Derived narration
  // ---------------------------------------------------------------------------
  const lastNarration = useMemo<NarrationSegment | null>(() => {
    const segments = narrationRef.current;
    if (segments.length === 0) return null;

    // Binary search for the last segment whose start <= currentTime.
    let lo = 0;
    let hi = segments.length - 1;
    let result: NarrationSegment | null = null;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (segments[mid].start <= currentTime) {
        result = segments[mid];
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return result;
  }, [currentTime]);

  // ---------------------------------------------------------------------------
  // Imperative controls
  // ---------------------------------------------------------------------------
  const seekTo = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = seconds;
      }
    },
    [videoRef],
  );

  const play = useCallback(() => {
    videoRef.current?.play();
  }, [videoRef]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, [videoRef]);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, [videoRef]);

  return {
    currentTime,
    currentChapter,
    currentChapterIndex,
    currentConcepts,
    lastNarration,
    isPlaying,
    seekTo,
    play,
    pause,
    toggle,
  };
}
