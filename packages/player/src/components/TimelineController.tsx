'use client';

import { useCallback, useRef, type MouseEvent } from 'react';
import type { Chapter } from '../types/lesson';

/* ------------------------------------------------------------------ */
/*  Theme tokens                                                       */
/* ------------------------------------------------------------------ */
const COLORS = {
  bg: '#0D0D1A',
  surface: '#1A1A2E',
  track: '#5A5A9A',
  progress: '#FF6B6B',
  text: '#E8E8F0',
  textDim: '#8888AA',
  chapterMarker: '#E8E8F0',
} as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Format seconds as M:SS or H:MM:SS. */
function formatTime(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0
    ? `${hrs}:${pad(mins)}:${pad(secs)}`
    : `${mins}:${pad(secs)}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface TimelineControllerProps {
  /** Whether the video is currently playing. */
  isPlaying: boolean;
  /** Current playback time in seconds. */
  currentTime: number;
  /** Total video duration in seconds. */
  duration: number;
  /** All chapter markers. */
  chapters: Chapter[];
  /** Currently active chapter (may be null before playback starts). */
  currentChapter: Chapter | null;
  /** Called when the user clicks play / pause. */
  onPlayPause: () => void;
  /** Called when the user seeks to a specific time. */
  onSeek: (timeSeconds: number) => void;
}

export default function TimelineController({
  isPlaying,
  currentTime,
  duration,
  chapters,
  currentChapter,
  onPlayPause,
  onSeek,
}: TimelineControllerProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? currentTime / duration : 0;

  /* ---- seek on click / drag ---- */
  const seekFromEvent = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek],
  );

  const handleTrackClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => seekFromEvent(e.clientX),
    [seekFromEvent],
  );

  /* ---------------------------------------------------------------- */
  /*  Styles                                                           */
  /* ---------------------------------------------------------------- */
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 16px 12px',
    background: COLORS.surface,
    borderRadius: 8,
    userSelect: 'none',
  };

  const chapterLabelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: COLORS.text,
    minHeight: 18,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const trackContainerStyle: React.CSSProperties = {
    position: 'relative',
    height: 6,
    borderRadius: 3,
    background: COLORS.track,
    cursor: 'pointer',
  };

  const progressBarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${progress * 100}%`,
    borderRadius: 3,
    background: COLORS.progress,
    transition: 'width 0.15s linear',
    pointerEvents: 'none',
  };

  const controlsRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const playBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: COLORS.progress,
    color: COLORS.bg,
    cursor: 'pointer',
    fontSize: 14,
    flexShrink: 0,
  };

  const timeStyle: React.CSSProperties = {
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.textDim,
    flexShrink: 0,
  };

  /* ---------------------------------------------------------------- */
  /*  Chapter marker rendering                                         */
  /* ---------------------------------------------------------------- */
  const renderChapterMarkers = () => {
    if (duration <= 0) return null;
    return chapters.map((ch) => {
      const pct = (ch.startSeconds / duration) * 100;
      // Skip markers at 0% (the very start) to avoid visual clutter.
      if (pct <= 0) return null;
      return (
        <div
          key={ch.id}
          title={ch.title}
          style={{
            position: 'absolute',
            left: `${pct}%`,
            top: -3,
            width: 2,
            height: 12,
            borderRadius: 1,
            background: COLORS.chapterMarker,
            opacity: 0.7,
            pointerEvents: 'none',
            transform: 'translateX(-1px)',
          }}
        />
      );
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div style={containerStyle}>
      {/* Current chapter title */}
      <div style={chapterLabelStyle}>
        {currentChapter ? currentChapter.title : '\u00A0'}
      </div>

      {/* Progress track with chapter markers */}
      <div
        ref={trackRef}
        style={trackContainerStyle}
        onClick={handleTrackClick}
        role="slider"
        aria-label="Video progress"
        aria-valuenow={Math.round(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        tabIndex={0}
      >
        <div style={progressBarStyle} />
        {renderChapterMarkers()}
      </div>

      {/* Controls row */}
      <div style={controlsRowStyle}>
        <button
          type="button"
          style={playBtnStyle}
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '\u275A\u275A' : '\u25B6'}
        </button>

        <span style={timeStyle}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
