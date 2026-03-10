'use client';

import {useCallback, useEffect, useRef} from 'react';
import type {NarrationSegment} from '@/types/lesson';

export interface TranscriptPanelProps {
  narration: NarrationSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}

/** Format seconds as M:SS or H:MM:SS. */
function formatTimestamp(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Determine the index of the active narration segment for a given playback
 * time.  Returns the last segment whose `start` is <= currentTime, or -1
 * if no segment has started yet.
 */
function activeSegmentIndex(
  narration: NarrationSegment[],
  currentTime: number,
): number {
  let active = -1;
  for (let i = 0; i < narration.length; i++) {
    if (narration[i].start <= currentTime) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}

export default function TranscriptPanel({
  narration,
  currentTime,
  onSeek,
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const currentIndex = activeSegmentIndex(narration, currentTime);

  // Auto-scroll to the active segment when it changes.
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Only scroll if the element is outside the visible area.
      if (
        elRect.top < containerRect.top ||
        elRect.bottom > containerRect.bottom
      ) {
        el.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    }
  }, [currentIndex]);

  const handleClick = useCallback(
    (start: number) => {
      onSeek(start);
    },
    [onSeek],
  );

  return (
    <div
      ref={containerRef}
      style={{
        background: '#0D0D1A',
        padding: '16px 0',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
      role="log"
      aria-label="Lesson transcript"
    >
      {narration.map((segment, index) => {
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <button
            key={`${segment.start}-${index}`}
            ref={isCurrent ? activeRef : undefined}
            onClick={() => handleClick(segment.start)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              background: isCurrent
                ? 'rgba(244, 184, 96, 0.06)'
                : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              opacity: isPast ? 0.5 : 1,
              transition: 'opacity 200ms ease, background 150ms ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.background = 'rgba(232, 232, 240, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {/* Timestamp */}
            <span
              style={{
                flexShrink: 0,
                fontFamily: 'Geist Mono, monospace',
                fontSize: 11,
                color: isCurrent ? '#F4B860' : '#8A8AA0',
                lineHeight: 1.8,
                userSelect: 'none',
                minWidth: 40,
              }}
            >
              {formatTimestamp(segment.start)}
            </span>

            {/* Narration text */}
            <span
              style={{
                flex: 1,
                fontFamily: 'Instrument Serif, Playfair Display, serif',
                fontSize: 15,
                lineHeight: 1.6,
                color: isCurrent ? '#F4B860' : '#E8E8F0',
              }}
            >
              {segment.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
