'use client';

import {useMemo} from 'react';
import type {PanelItem} from '../../hooks/useAnimationEngine';
import type {CinematicTextElement, EquationSequenceElement} from '../../types/animation';
import {renderTypewriter, renderKatexTypewriter, computeSequenceReveal, CURSOR_BLINK_STYLE} from '../../lib/typewriterReveal';

interface Props {
  item: PanelItem;
  isActive: boolean;
  stageProgress: number;
}

const BORDER_COLORS: Record<string, string> = {
  heading: '#FFF5E6',
  body: '#5A5A9A',
  accent: '#FF6B4A',
  definition: '#6BC5E8',
};

const STYLE_MAP: Record<string, React.CSSProperties> = {
  heading: {fontSize: 18, fontWeight: 700, color: '#FFF5E6'},
  body: {fontSize: 15, fontWeight: 400, color: '#E8E8F0', lineHeight: 1.6},
  accent: {fontSize: 15, fontWeight: 600, color: '#FF6B4A'},
  definition: {fontSize: 15, fontWeight: 400, color: '#6BC5E8', fontStyle: 'italic'},
};

function CinematicTextItem({
  element,
  progress,
  isTypewriter,
}: {
  element: CinematicTextElement;
  progress: number;
  isTypewriter: boolean;
}) {
  const {text, style, color, fontSize} = element;
  const baseStyle = STYLE_MAP[style] ?? STYLE_MAP.body;

  const nodes = useMemo(
    () => renderTypewriter(text, progress, isTypewriter, color ?? (baseStyle.color as string)),
    [text, progress, isTypewriter, color, baseStyle.color],
  );

  return (
    <div
      style={{
        ...baseStyle,
        color: color ?? baseStyle.color,
        fontSize: fontSize ?? baseStyle.fontSize,
        whiteSpace: 'pre-wrap',
      }}
    >
      {nodes}
    </div>
  );
}

function EquationSequenceItem({
  element,
  progress,
  isTypewriter,
}: {
  element: EquationSequenceElement;
  progress: number;
  isTypewriter: boolean;
}) {
  const {steps, color = '#E8E8F0', fontSize = 16} = element;
  const weights = useMemo(() => steps.map((s) => s.weight ?? 1), [steps]);

  const {activeIndex, stepProgress} = useMemo(
    () => computeSequenceReveal(steps.length, weights, progress),
    [steps.length, weights, progress],
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6, color, fontSize}}>
      {steps.map((step, i) => {
        if (i > activeIndex && isTypewriter) return null;
        const isRevealed = i < activeIndex;
        const isCurrentStep = i === activeIndex;
        const p = isRevealed ? 1 : isCurrentStep ? stepProgress : 0;

        return (
          <div key={i} style={{opacity: p > 0 || !isTypewriter ? 1 : 0}}>
            {isTypewriter ? renderKatexTypewriter(step.tex, p) : renderKatexTypewriter(step.tex, 1)}
          </div>
        );
      })}
    </div>
  );
}

export function TextPanelItem({item, isActive, stageProgress}: Props) {
  const {element, enterAnimation} = item;
  const isTypewriter = isActive && (enterAnimation === 'typewriter' || enterAnimation === 'draw-in');
  const progress = isActive ? stageProgress : 1;

  const borderColor =
    element.type === 'cinematic-text'
      ? BORDER_COLORS[(element as CinematicTextElement).style] ?? '#5A5A9A'
      : '#5A5A9A';

  return (
    <div
      style={{
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: 12,
        paddingTop: 4,
        paddingBottom: 4,
        opacity: isActive && isTypewriter && stageProgress < 0.02 ? 0 : 1,
        transform: isActive && stageProgress < 0.05 ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      }}
    >
      {element.type === 'cinematic-text' ? (
        <CinematicTextItem
          element={element as CinematicTextElement}
          progress={progress}
          isTypewriter={isTypewriter}
        />
      ) : (
        <EquationSequenceItem
          element={element as EquationSequenceElement}
          progress={progress}
          isTypewriter={isTypewriter}
        />
      )}
      <style>{CURSOR_BLINK_STYLE}</style>
    </div>
  );
}
