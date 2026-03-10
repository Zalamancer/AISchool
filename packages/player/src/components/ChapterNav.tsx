'use client';

import {useCallback} from 'react';
import type {Chapter} from '@/types/lesson';

export interface ChapterNavProps {
  chapters: Chapter[];
  currentChapterIndex: number;
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

export default function ChapterNav({
  chapters,
  currentChapterIndex,
  onSeek,
}: ChapterNavProps) {
  const handleClick = useCallback(
    (startSeconds: number) => {
      onSeek(startSeconds);
    },
    [onSeek],
  );

  return (
    <nav
      style={{
        background: '#0D0D1A',
        padding: '12px 0',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
      aria-label="Chapter navigation"
    >
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {chapters.map((chapter, index) => {
          const isCurrent = index === currentChapterIndex;
          const isCompleted = index < currentChapterIndex;

          return (
            <li key={chapter.id}>
              <button
                onClick={() => handleClick(chapter.startSeconds)}
                aria-current={isCurrent ? 'step' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderLeft: isCurrent
                    ? '3px solid #FF6B6B'
                    : '3px solid transparent',
                  background: isCurrent
                    ? 'rgba(255, 107, 107, 0.08)'
                    : 'transparent',
                  color: '#E8E8F0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 14,
                  transition: 'background 150ms ease, border-color 150ms ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = 'rgba(232, 232, 240, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Chapter number / checkmark */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: 12,
                    fontWeight: 600,
                    background: isCurrent
                      ? 'rgba(255, 107, 107, 0.2)'
                      : isCompleted
                        ? 'rgba(100, 200, 130, 0.15)'
                        : 'rgba(232, 232, 240, 0.08)',
                    color: isCurrent
                      ? '#FF6B6B'
                      : isCompleted
                        ? '#64C882'
                        : '#8A8AA0',
                  }}
                >
                  {isCompleted ? '\u2713' : index + 1}
                </span>

                {/* Title + timestamp */}
                <span style={{flex: 1, minWidth: 0}}>
                  <span
                    style={{
                      display: 'block',
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent ? '#FFFFFF' : '#E8E8F0',
                      lineHeight: 1.4,
                    }}
                  >
                    {chapter.title}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      color: '#8A8AA0',
                      fontFamily: 'Geist Mono, monospace',
                      marginTop: 2,
                    }}
                  >
                    {formatTimestamp(chapter.startSeconds)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
