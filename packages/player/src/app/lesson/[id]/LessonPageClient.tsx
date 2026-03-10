'use client';

import {useCallback, useMemo, useState} from 'react';
import type {LessonData} from '@/types/lesson';
import LessonPlayer from '@/components/LessonPlayer';
import ChapterNav from '@/components/ChapterNav';
import TranscriptPanel from '@/components/TranscriptPanel';

interface LessonPageClientProps {
  lesson: LessonData;
}

type SidebarTab = 'chapters' | 'transcript';

export default function LessonPageClient({lesson}: LessonPageClientProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chapters');

  /* ---------------------------------------------------------------- */
  /*  Shared playback state                                            */
  /*  LessonPlayer manages its own <video> internally — we mirror     */
  /*  currentTime here so ChapterNav and TranscriptPanel stay in sync. */
  /* ---------------------------------------------------------------- */
  const [currentTime, setCurrentTime] = useState(0);

  /** Current chapter index derived from currentTime. */
  const currentChapterIndex = useMemo(() => {
    let idx = 0;
    for (let i = lesson.chapters.length - 1; i >= 0; i--) {
      if (currentTime >= lesson.chapters[i].startSeconds) {
        idx = i;
        break;
      }
    }
    return idx;
  }, [currentTime, lesson.chapters]);

  /**
   * We cannot directly call LessonPlayer's internal seekTo from outside.
   * Instead, we dispatch a custom event that LessonPlayer (or a future
   * ref-based API) can listen for.  For the initial integration, the
   * sidebar seek updates our mirrored time and we rely on the video
   * element reference approach below.
   */
  const videoElementRef = useMemo(() => {
    // We use a mutable container so the player registration callback
    // and the seek handler share the same reference.
    return {current: null as HTMLVideoElement | null};
  }, []);

  const handleSeek = useCallback(
    (seconds: number) => {
      setCurrentTime(seconds);
      if (videoElementRef.current) {
        videoElementRef.current.currentTime = seconds;
      }
    },
    [videoElementRef],
  );

  /* ---------------------------------------------------------------- */
  /*  Poll currentTime from the <video> element once it appears.       */
  /*  We grab it via a simple DOM query — pragmatic until LessonPlayer */
  /*  exposes a ref or callback prop.                                  */
  /* ---------------------------------------------------------------- */
  const containerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      // Find the <video> inside LessonPlayer after first paint.
      const findVideo = () => {
        const video = node.querySelector('video');
        if (video) {
          videoElementRef.current = video;
          const onTimeUpdate = () => setCurrentTime(video.currentTime);
          video.addEventListener('timeupdate', onTimeUpdate);
        } else {
          // Video may not be in the DOM yet; retry once.
          requestAnimationFrame(() => {
            const v = node.querySelector('video');
            if (v) {
              videoElementRef.current = v;
              v.addEventListener('timeupdate', () =>
                setCurrentTime(v.currentTime),
              );
            }
          });
        }
      };
      findVideo();
    },
    [videoElementRef],
  );

  /* ---------------------------------------------------------------- */
  /*  Styles                                                           */
  /* ---------------------------------------------------------------- */
  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    gap: 0,
  };

  const playerColumnStyle: React.CSSProperties = {
    flex: '1 1 70%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '24px 24px 24px 32px',
    boxSizing: 'border-box',
  };

  const sidebarStyle: React.CSSProperties = {
    flex: '0 0 30%',
    maxWidth: 380,
    minWidth: 280,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid rgba(232, 232, 240, 0.08)',
    background: '#0D0D1A',
    height: '100vh',
    position: 'sticky',
    top: 0,
    boxSizing: 'border-box',
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid rgba(232, 232, 240, 0.08)',
    flexShrink: 0,
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderBottom: isActive ? '2px solid #FF6B6B' : '2px solid transparent',
    background: 'transparent',
    color: isActive ? '#FFFFFF' : '#8A8AA0',
    fontFamily: 'Geist, sans-serif',
    fontSize: 13,
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    transition: 'color 150ms ease, border-color 150ms ease',
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  });

  const tabContentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
  };

  return (
    <div style={layoutStyle} ref={containerRefCallback}>
      {/* ---- Video player column (70%) ---- */}
      <div style={playerColumnStyle}>
        <LessonPlayer
          videoSrc={`/videos/${lesson.scene}.mp4`}
          lessonData={lesson}
        />
      </div>

      {/* ---- Sidebar (30%) ---- */}
      <aside style={sidebarStyle} aria-label="Lesson sidebar">
        {/* Tab bar */}
        <div style={tabBarStyle} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'chapters'}
            style={tabStyle(activeTab === 'chapters')}
            onClick={() => setActiveTab('chapters')}
          >
            Chapters
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'transcript'}
            style={tabStyle(activeTab === 'transcript')}
            onClick={() => setActiveTab('transcript')}
          >
            Transcript
          </button>
        </div>

        {/* Tab content */}
        <div style={tabContentStyle} role="tabpanel">
          {activeTab === 'chapters' ? (
            <ChapterNav
              chapters={lesson.chapters}
              currentChapterIndex={currentChapterIndex}
              onSeek={handleSeek}
            />
          ) : (
            <TranscriptPanel
              narration={lesson.narration}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
