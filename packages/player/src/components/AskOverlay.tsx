'use client';

import React, { useState, useRef, useEffect, type FormEvent } from 'react';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface AskOverlayProps {
  /** Whether the overlay panel is visible. */
  visible: boolean;
  /** Called when the student closes / dismisses the overlay. */
  onClose: () => void;
  /** Title of the current chapter being watched. */
  currentChapter: string;
  /** Key concepts covered in this chapter. */
  currentConcepts: string[];
  /** The last narration line the student heard. */
  lastNarration: string;
  /** Callback invoked when the student submits a question. */
  onAsk?: (question: string) => void;
  /** AI response text to display. */
  aiResponse?: string | null;
  /** Whether the AI response is currently loading. */
  isLoading?: boolean;
  /** Error message, if any. */
  error?: string | null;
  /** Called when the mic button is pressed (voice input UI hook). */
  onMicPress?: () => void;
  /** Whether the mic is actively recording. */
  isMicActive?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Animated loading dots                                              */
/* ------------------------------------------------------------------ */

function LoadingDots() {
  return (
    <span style={styles.loadingDots} aria-label="Loading">
      <span style={styles.dot}>.</span>
      <span style={{ ...styles.dot, animationDelay: '0.2s' }}>.</span>
      <span style={{ ...styles.dot, animationDelay: '0.4s' }}>.</span>
      {/* Inline keyframe injected once via <style> in the component */}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AskOverlay({
  visible,
  onClose,
  currentChapter,
  currentConcepts,
  lastNarration,
  onAsk,
  aiResponse = null,
  isLoading = false,
  error = null,
  onMicPress,
  isMicActive = false,
}: AskOverlayProps) {
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when the panel opens.
  useEffect(() => {
    if (visible) {
      // Small delay so the slide animation doesn't conflict with focus scroll.
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    onAsk?.(trimmed);
    setQuestion('');
  };

  return (
    <>
      {/* Inject keyframe animation for the loading dots */}
      <style>{keyframeCSS}</style>

      {/* Backdrop (click to close) */}
      {visible && (
        <div
          style={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-label="Ask a question"
        aria-hidden={!visible}
        style={{
          ...styles.panel,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Ask a Question</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close question panel"
          >
            &times;
          </button>
        </div>

        {/* Context badge */}
        <div style={styles.contextBadge}>
          <span style={styles.contextLabel}>Chapter:</span>{' '}
          <span style={styles.contextValue}>{currentChapter}</span>
          {currentConcepts.length > 0 && (
            <div style={styles.conceptsRow}>
              {currentConcepts.map((concept) => (
                <span key={concept} style={styles.conceptTag}>
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable response area */}
        <div style={styles.responseArea}>
          {isLoading && (
            <div style={styles.loadingContainer}>
              <LoadingDots />
              <span style={styles.loadingText}>Thinking</span>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>!</span>
              <span>{error}</span>
            </div>
          )}

          {aiResponse && !isLoading && (
            <div style={styles.responseText}>{aiResponse}</div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSubmit} style={styles.inputBar}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            style={styles.input}
            aria-label="Your question"
          />

          {/* Mic button */}
          {onMicPress && (
            <button
              type="button"
              onClick={onMicPress}
              style={{
                ...styles.micButton,
                ...(isMicActive ? styles.micButtonActive : {}),
              }}
              aria-label={isMicActive ? 'Stop recording' : 'Start voice input'}
            >
              <MicIcon active={isMicActive} />
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || question.trim().length === 0}
            style={{
              ...styles.submitButton,
              opacity: isLoading || question.trim().length === 0 ? 0.4 : 1,
            }}
            aria-label="Submit question"
          >
            Ask
          </button>
        </form>

        {/* Continue button */}
        {aiResponse && !isLoading && (
          <button
            style={styles.continueButton}
            onClick={onClose}
          >
            Continue
          </button>
        )}
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mic SVG icon                                                       */
/* ------------------------------------------------------------------ */

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#FF6B4A' : '#8A8AA0'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Keyframe CSS (injected via <style>)                                */
/* ------------------------------------------------------------------ */

const keyframeCSS = `
@keyframes askOverlayDotPulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}
`;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const CORAL = '#FF6B4A';
const BG = 'rgba(13, 13, 26, 0.85)';
const TEXT = '#E8E8F0';
const TEXT_DIM = '#8A8AA0';
const SURFACE = 'rgba(255, 255, 255, 0.06)';

const styles: Record<string, React.CSSProperties> = {
  /* Backdrop */
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
    background: 'rgba(0, 0, 0, 0.35)',
  },

  /* Panel */
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '40vw',
    minWidth: 340,
    maxWidth: 600,
    height: '100vh',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    background: BG,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderLeft: `2px solid ${CORAL}`,
    color: TEXT,
    fontFamily: 'Geist, system-ui, sans-serif',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
  },

  /* Header */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 12px',
    borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: TEXT_DIM,
    fontSize: 28,
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
    transition: 'color 0.15s',
  },

  /* Context badge */
  contextBadge: {
    padding: '12px 24px',
    fontSize: 13,
    color: TEXT_DIM,
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  contextLabel: {
    fontWeight: 600,
    color: TEXT,
  },
  contextValue: {
    color: CORAL,
  },
  conceptsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
  },
  conceptTag: {
    display: 'inline-block',
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 999,
    background: 'rgba(255, 107, 74, 0.12)',
    color: CORAL,
    border: `1px solid rgba(255, 107, 74, 0.25)`,
  },

  /* Response area */
  responseArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px 24px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: TEXT_DIM,
  },
  loadingDots: {
    display: 'inline-flex',
    gap: 2,
    fontSize: 28,
    lineHeight: 1,
  },
  dot: {
    display: 'inline-block',
    animation: 'askOverlayDotPulse 1.4s infinite ease-in-out',
  },
  loadingText: {
    fontSize: 14,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 10,
    background: 'rgba(255, 80, 60, 0.1)',
    border: '1px solid rgba(255, 80, 60, 0.25)',
    fontSize: 14,
    color: '#FF7A6A',
  },
  errorIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(255, 80, 60, 0.2)',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
  },

  /* Input bar */
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  input: {
    flex: 1,
    height: 44,
    padding: '0 16px',
    fontSize: 14,
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: SURFACE,
    color: TEXT,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  micButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: SURFACE,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    flexShrink: 0,
  },
  micButtonActive: {
    background: 'rgba(255, 107, 74, 0.15)',
    borderColor: CORAL,
  },
  submitButton: {
    height: 44,
    padding: '0 22px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 12,
    border: 'none',
    background: CORAL,
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    flexShrink: 0,
  },

  /* Continue button */
  continueButton: {
    margin: '0 24px 20px',
    height: 48,
    borderRadius: 12,
    border: `1.5px solid ${CORAL}`,
    background: 'rgba(255, 107, 74, 0.08)',
    color: CORAL,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};
