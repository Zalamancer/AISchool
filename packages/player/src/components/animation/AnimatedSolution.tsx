'use client';

import {useAnimationEngine} from '../../hooks/useAnimationEngine';
import type {AnimationTimeline} from '../../types/animation';
import type {SolutionStep} from '../../hooks/useProblemSolver';
import {MathCanvas} from './MathCanvas';
import {TextPanel} from './TextPanel';
import {AnimationPlayer} from './AnimationPlayer';
import {SolutionDisplay} from '../SolutionDisplay';
import {useState, useRef, useCallback, useEffect} from 'react';

interface Props {
  timeline: AnimationTimeline;
  steps: SolutionStep[];
}

export function AnimatedSolution({timeline, steps}: Props) {
  const [showText, setShowText] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const engine = useAnimationEngine(timeline);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  if (showText) {
    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 8}}>
          <button
            onClick={() => setShowText(false)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              color: '#8A8AA0',
              background: 'transparent',
              border: '1px solid #252550',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Show Animation
          </button>
        </div>
        <SolutionDisplay steps={steps} />
      </div>
    );
  }

  const hasPanelItems = engine.panelItems.length > 0 || engine.totalStages > 1;

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {
        // Fallback: use webkit prefix for Safari
        const webkitEl = el as HTMLDivElement & {webkitRequestFullscreen?: () => void};
        webkitEl.webkitRequestFullscreen?.();
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: '#0D0D1A',
        ...(isFullscreen ? {padding: 24, height: '100vh', boxSizing: 'border-box' as const} : {}),
      }}
    >
      {/* Toggle buttons */}
      <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
        <button
          onClick={() => setShowText(true)}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            color: '#8A8AA0',
            background: 'transparent',
            border: '1px solid #252550',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Show Text
        </button>
        <button
          onClick={toggleFullscreen}
          title="Toggle fullscreen"
          style={{
            padding: '6px 14px',
            fontSize: 13,
            color: '#8A8AA0',
            background: 'transparent',
            border: '1px solid #252550',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          ⛶
        </button>
      </div>

      {/* Split layout: graph left, text panel right */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#0D0D1A',
          flex: 1,
          minHeight: 480,
        }}
      >
        {/* Graph pane */}
        <div
          style={{
            flexBasis: engine.showGraph ? '55%' : '0%',
            flexShrink: 0,
            flexGrow: 0,
            transition: 'flex-basis 0.5s ease-out, opacity 0.3s ease-out',
            opacity: engine.showGraph ? 1 : 0,
            overflow: 'hidden',
          }}
        >
          <MathCanvas
            elements={engine.activeElements}
            enteringElements={engine.enteringElements}
            highlightElements={engine.highlightElements}
            stageProgress={engine.stageProgress}
            viewBox={timeline.viewBox}
          />
        </div>

        {/* Text panel */}
        {hasPanelItems && (
          <div
            style={{
              flex: 1,
              borderLeft: engine.showGraph ? '1px solid #252550' : 'none',
              minWidth: 0,
            }}
          >
            <TextPanel
              items={engine.panelItems}
              currentStage={engine.currentStage}
              stageProgress={engine.stageProgress}
            />
          </div>
        )}
      </div>

      {/* Player controls */}
      <AnimationPlayer
        currentStage={engine.currentStage}
        totalStages={engine.totalStages}
        isPlaying={engine.isPlaying}
        stageProgress={engine.stageProgress}
        onPlayPause={engine.togglePlayPause}
        onNext={engine.nextStage}
        onPrev={engine.prevStage}
        onSeek={engine.goToStage}
        onFullscreen={toggleFullscreen}
      />
    </div>
  );
}
