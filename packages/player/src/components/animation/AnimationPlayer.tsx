'use client';

interface Props {
  currentStage: number;
  totalStages: number;
  isPlaying: boolean;
  stageProgress: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (stage: number) => void;
  onFullscreen?: () => void;
}

const btnBase: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#E8E8F0',
  cursor: 'pointer',
  padding: '6px 10px',
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
};

export function AnimationPlayer({
  currentStage,
  totalStages,
  isPlaying,
  stageProgress,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onFullscreen,
}: Props) {
  // Progress through all stages
  const totalProgress = ((currentStage + stageProgress) / totalStages) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#141428',
        borderRadius: 10,
        border: '1px solid #252550',
      }}
    >
      {/* Prev */}
      <button
        onClick={onPrev}
        disabled={currentStage === 0}
        style={{...btnBase, opacity: currentStage === 0 ? 0.3 : 1}}
        title="Previous step (Left arrow)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        style={{
          ...btnBase,
          background: '#FF6B4A',
          borderRadius: '50%',
          width: 32,
          height: 32,
          padding: 0,
        }}
        title="Play/Pause (Space)"
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5l9 5.5-9 5.5z" />
          </svg>
        )}
      </button>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={currentStage >= totalStages - 1}
        style={{...btnBase, opacity: currentStage >= totalStages - 1 ? 0.3 : 1}}
        title="Next step (Right arrow)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Step indicator */}
      <span style={{color: '#8A8AA0', fontSize: 13, minWidth: 60, textAlign: 'center'}}>
        Step {currentStage + 1} / {totalStages}
      </span>

      {/* Progress bar */}
      <div
        style={{
          flex: 1,
          height: 4,
          background: '#252550',
          borderRadius: 2,
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          const stage = Math.floor(pct * totalStages);
          onSeek(Math.max(0, Math.min(stage, totalStages - 1)));
        }}
      >
        <div
          style={{
            width: `${totalProgress}%`,
            height: '100%',
            background: '#FF6B4A',
            borderRadius: 2,
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Fullscreen toggle */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          style={btnBase}
          title="Toggle fullscreen"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
          </svg>
        </button>
      )}
    </div>
  );
}
