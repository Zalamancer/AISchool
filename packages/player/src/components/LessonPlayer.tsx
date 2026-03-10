'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Chapter, LessonData } from '../types/lesson';
import TimelineController from './TimelineController';

/* ------------------------------------------------------------------ */
/*  Theme tokens                                                       */
/* ------------------------------------------------------------------ */
const COLORS = {
  bg: '#0D0D1A',
  text: '#E8E8F0',
  overlay: 'rgba(13, 13, 26, 0.55)',
  accent: '#FF6B6B',
} as const;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface LessonPlayerProps {
  /** URL to the MP4 video file. */
  videoSrc: string;
  /** Lesson metadata including chapters and narration cues. */
  lessonData: LessonData;
  /** Fired when the student triggers "pause to ask". Receives the
   *  current playback time and active chapter so the host can open
   *  an AI-Q&A panel. */
  onPause?: (timeSeconds: number, chapter: Chapter | null) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LessonPlayer({
  videoSrc,
  lessonData,
  onPause,
}: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lessonData.durationSeconds);

  /* ---- derived: current chapter ---- */
  const currentChapter = useMemo<Chapter | null>(() => {
    const sorted = [...lessonData.chapters].sort(
      (a, b) => b.startSeconds - a.startSeconds,
    );
    return sorted.find((ch) => currentTime >= ch.startSeconds) ?? null;
  }, [currentTime, lessonData.chapters]);

  /* ---- derived: current narration ---- */
  const currentNarration = useMemo(() => {
    const sorted = [...lessonData.narration].sort(
      (a, b) => b.start - a.start,
    );
    return sorted.find((n) => currentTime >= n.start) ?? null;
  }, [currentTime, lessonData.narration]);

  /* ---------------------------------------------------------------- */
  /*  Video event handlers                                             */
  /* ---------------------------------------------------------------- */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, []);

  const handleVideoPlay = useCallback(() => setIsPlaying(true), []);
  const handleVideoPause = useCallback(() => setIsPlaying(false), []);
  const handleVideoEnded = useCallback(() => setIsPlaying(false), []);

  /* ---------------------------------------------------------------- */
  /*  Playback controls                                                */
  /* ---------------------------------------------------------------- */
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  /** "Pause to Ask" handler: pauses video and notifies host. */
  const handlePauseToAsk = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    onPause?.(video.currentTime, currentChapter);
  }, [onPause, currentChapter]);

  /* ---- keyboard shortcuts (space = toggle, q = pause-to-ask) ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only handle when focus is inside the player or body-level.
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        handlePauseToAsk();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlayPause, handlePauseToAsk]);

  /* ---------------------------------------------------------------- */
  /*  Styles                                                           */
  /* ---------------------------------------------------------------- */
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    background: COLORS.bg,
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: COLORS.text,
  };

  const videoContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%', // 16:9 aspect ratio
  };

  const videoStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#000',
  };

  const narrationOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px 20px 14px',
    background:
      'linear-gradient(to top, rgba(13,13,26,0.85) 0%, transparent 100%)',
    pointerEvents: 'none',
  };

  const narrationTextStyle: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.5,
    color: COLORS.text,
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
    maxWidth: 720,
  };

  const pauseToAskBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.bg,
    background: COLORS.accent,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    zIndex: 2,
    pointerEvents: 'auto',
  };

  const controlsAreaStyle: React.CSSProperties = {
    padding: '8px 12px 12px',
  };

  const titleBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px 4px',
  };

  const lessonTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const courseLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#8888AA',
    flexShrink: 0,
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div style={wrapperStyle}>
      {/* Title bar */}
      <div style={titleBarStyle}>
        <span style={lessonTitleStyle}>{lessonData.title}</span>
        <span style={courseLabelStyle}>
          {lessonData.course} &middot; Ch&nbsp;{lessonData.chapter}, Lesson&nbsp;
          {lessonData.lesson}
        </span>
      </div>

      {/* Video + overlays */}
      <div style={videoContainerStyle}>
        <video
          ref={videoRef}
          src={videoSrc}
          style={videoStyle}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
          playsInline
          preload="metadata"
        />

        {/* Pause-to-ask button */}
        <button
          type="button"
          style={pauseToAskBtnStyle}
          onClick={handlePauseToAsk}
          aria-label="Pause and ask a question"
        >
          Pause &amp; Ask
        </button>

        {/* Narration subtitle overlay */}
        {currentNarration && (
          <div style={narrationOverlayStyle}>
            <p style={narrationTextStyle}>{currentNarration.text}</p>
          </div>
        )}
      </div>

      {/* Timeline + playback controls */}
      <div style={controlsAreaStyle}>
        <TimelineController
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          chapters={lessonData.chapters}
          currentChapter={currentChapter}
          onPlayPause={togglePlayPause}
          onSeek={seekTo}
        />
      </div>
    </div>
  );
}
