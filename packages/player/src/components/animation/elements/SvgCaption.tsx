'use client';

import type {CaptionElement, EnterAnimation} from '../../../types/animation';
import {MathText} from '../../../lib/mathText';
import {SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: CaptionElement;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
}

const LINE_STYLES: Record<string, React.CSSProperties> = {
  heading: {
    fontSize: 15,
    fontWeight: 700,
    color: '#FF6B4A',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    fontWeight: 400,
    color: '#E8E8F0',
    lineHeight: 1.5,
  },
  math: {
    fontSize: 13,
    fontWeight: 400,
    color: '#E8E8F0',
    lineHeight: 1.5,
    margin: '1px 0',
  },
  highlight: {
    fontSize: 13,
    fontWeight: 600,
    color: '#FF6B4A',
    lineHeight: 1.5,
  },
};

const PLACEMENT_STYLES: Record<string, React.CSSProperties> = {
  bottom: {
    position: 'absolute',
    bottom: '3%',
    left: '50%',
    transform: 'translateX(-50%)',
    maxHeight: '35%',
    overflow: 'hidden',
  },
  top: {
    position: 'absolute',
    top: '3%',
    left: '50%',
    transform: 'translateX(-50%)',
    maxHeight: '35%',
    overflow: 'hidden',
  },
  center: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '60%',
    overflow: 'hidden',
  },
};

export function SvgCaption({element, isEntering, enterAnimation}: Props) {
  const {lines, placement = 'bottom', bgColor = 'rgba(13,13,26,0.88)', maxWidthPct = 92} = element;
  const fadeIn = isEntering && (enterAnimation === 'fade-in' || enterAnimation === 'draw-in');

  return (
    <div
      style={{
        ...PLACEMENT_STYLES[placement],
        maxWidth: `${maxWidthPct}%`,
        width: 'max-content',
        background: bgColor,
        backdropFilter: 'blur(4px)',
        borderRadius: 10,
        padding: '8px 14px',
        pointerEvents: 'none',
        opacity: fadeIn ? 0 : 1,
        transition: `opacity 0.4s ${SPRING_SMOOTH}`,
        zIndex: 10,
      }}
      ref={(el) => {
        if (el && fadeIn) {
          requestAnimationFrame(() => (el.style.opacity = '1'));
        }
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            ...LINE_STYLES[line.style],
            opacity: 0,
            transition: `opacity 0.4s ${SPRING_SMOOTH}`,
            transitionDelay: `${line.delayMs ?? i * 150}ms`,
          }}
          ref={(el) => {
            if (el) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  el.style.opacity = '1';
                });
              });
            }
          }}
        >
          <MathText text={line.text} />
        </div>
      ))}
    </div>
  );
}
