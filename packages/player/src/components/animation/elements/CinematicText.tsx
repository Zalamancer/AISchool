'use client';

import {useMemo} from 'react';
import type {CinematicTextElement, EnterAnimation} from '../../../types/animation';
import {renderTypewriter, CURSOR_BLINK_STYLE} from '../../../lib/typewriterReveal';
import {SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: CinematicTextElement;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
  stageProgress: number;
}

const STYLE_MAP: Record<string, React.CSSProperties> = {
  heading: {fontSize: 22, fontWeight: 700, color: '#FFF5E6'},
  body: {fontSize: 16, fontWeight: 400, color: '#E8E8F0', lineHeight: 1.6},
  accent: {fontSize: 16, fontWeight: 600, color: '#FF6B4A'},
  definition: {
    fontSize: 16,
    fontWeight: 400,
    color: '#6BC5E8',
    fontStyle: 'italic',
    borderLeft: '2px solid #6BC5E8',
    paddingLeft: 12,
  },
};

export function CinematicText({element, isEntering, enterAnimation, stageProgress}: Props) {
  const {text, position, style, color, fontSize, maxWidthPx, anchor = 'center'} = element;
  const isTypewriter = enterAnimation === 'typewriter';
  const isFadeIn = isEntering && (enterAnimation === 'fade-in' || enterAnimation === 'draw-in');

  const cursorColor = color ?? (STYLE_MAP[style]?.color as string) ?? '#E8E8F0';
  const rendered = useMemo(
    () => renderTypewriter(text, stageProgress, isTypewriter, cursorColor),
    [text, stageProgress, isTypewriter, cursorColor],
  );

  const textAlign = anchor === 'left' ? 'left' : anchor === 'right' ? 'right' : 'center';
  const translateX = anchor === 'left' ? '0' : anchor === 'right' ? '-100%' : '-50%';

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${position[0]}px)`,
        top: `calc(50% + ${position[1]}px)`,
        transform: `translateX(${translateX})`,
        color: color ?? STYLE_MAP[style]?.color ?? '#E8E8F0',
        fontSize: fontSize ?? STYLE_MAP[style]?.fontSize,
        fontWeight: STYLE_MAP[style]?.fontWeight as number | undefined,
        fontStyle: STYLE_MAP[style]?.fontStyle as string | undefined,
        borderLeft: STYLE_MAP[style]?.borderLeft as string | undefined,
        paddingLeft: STYLE_MAP[style]?.paddingLeft as number | undefined,
        lineHeight: STYLE_MAP[style]?.lineHeight as number | undefined,
        textAlign,
        maxWidth: maxWidthPx ?? 500,
        pointerEvents: 'none',
        opacity: isFadeIn ? 0 : 1,
        transition: `opacity 0.5s ${SPRING_SMOOTH}`,
        whiteSpace: 'pre-wrap',
      }}
      ref={(el) => {
        if (el && isFadeIn) {
          requestAnimationFrame(() => (el.style.opacity = '1'));
        }
      }}
    >
      {rendered}
      <style>{CURSOR_BLINK_STYLE}</style>
    </div>
  );
}
