'use client';

import {useMemo} from 'react';
import katex from 'katex';
import type {EquationSequenceElement, EnterAnimation} from '../../../types/animation';
import {computeSequenceReveal, renderKatexTypewriter} from '../../../lib/typewriterReveal';
import {SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: EquationSequenceElement;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
  stageProgress: number;
}

export function EquationSequence({element, isEntering, enterAnimation, stageProgress}: Props) {
  const {steps, position, color = '#E8E8F0', fontSize = 18, revealMode = 'crossfade'} = element;
  const fadeIn = isEntering && (enterAnimation === 'fade-in' || enterAnimation === 'draw-in');

  const weights = useMemo(() => steps.map((s) => s.weight ?? 1), [steps]);

  const {activeIndex, stepProgress} = useMemo(
    () => computeSequenceReveal(steps.length, weights, stageProgress),
    [steps.length, weights, stageProgress],
  );

  // Pre-render all steps as KaTeX HTML (for crossfade mode)
  const htmlSteps = useMemo(
    () =>
      steps.map((step) =>
        katex.renderToString(step.tex, {displayMode: true, throwOnError: false, trust: true}),
      ),
    [steps],
  );

  const renderTypewriterMode = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
      {steps.map((step, i) => {
        if (i > activeIndex) return null;
        const isRevealed = i < activeIndex;
        const isCurrentStep = i === activeIndex;
        const p = isRevealed ? 1 : isCurrentStep ? stepProgress : 0;
        return (
          <div key={i}>{renderKatexTypewriter(step.tex, p)}</div>
        );
      })}
    </div>
  );

  const renderCrossfadeMode = () => (
    <div style={{position: 'relative'}}>
      {htmlSteps.map((html, i) => {
        let opacity = 0;
        if (i === activeIndex) {
          opacity = 1;
        } else if (i === activeIndex - 1) {
          opacity = Math.max(0, 1 - stepProgress * 4);
        } else if (i === activeIndex + 1) {
          opacity = Math.max(0, (stepProgress - 0.75) * 4);
        }
        return (
          <div
            key={i}
            style={{
              position: i === activeIndex ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              opacity,
              transition: 'opacity 0.3s ease-out',
              visibility: opacity > 0 ? 'visible' : 'hidden',
            }}
            dangerouslySetInnerHTML={{__html: html}}
          />
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${position[0]}px)`,
        top: `calc(50% + ${position[1]}px)`,
        transform: 'translate(-50%, -50%)',
        color,
        fontSize,
        pointerEvents: 'none',
        opacity: fadeIn ? 0 : 1,
        transition: `opacity 0.5s ${SPRING_SMOOTH}`,
        whiteSpace: 'nowrap',
      }}
      ref={(el) => {
        if (el && fadeIn) {
          requestAnimationFrame(() => (el.style.opacity = '1'));
        }
      }}
    >
      {revealMode === 'typewriter' ? renderTypewriterMode() : renderCrossfadeMode()}
    </div>
  );
}
