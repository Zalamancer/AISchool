'use client';

import type {PointElement, EnterAnimation} from '../../../types/animation';
import {SCALE_IN_DURATION, SPRING_BOUNCY, FADE_IN_DURATION, SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: PointElement;
  gridScale: number;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
  filterId: string;
}

export function SvgPoint({element, gridScale, isEntering, enterAnimation, filterId}: Props) {
  const {position, color, radius = 4, label} = element;
  const cx = position[0] * gridScale;
  const cy = -position[1] * gridScale;

  const scaleIn = isEntering && enterAnimation === 'scale-in';
  const fadeIn = isEntering && (enterAnimation === 'fade-in' || enterAnimation === 'draw-in');

  return (
    <g
      style={{
        opacity: fadeIn || scaleIn ? 0 : 1,
        transform: scaleIn ? 'scale(0)' : 'scale(1)',
        transformOrigin: `${cx}px ${cy}px`,
        transition: scaleIn
          ? `transform ${SCALE_IN_DURATION} ${SPRING_BOUNCY}, opacity ${SCALE_IN_DURATION} ${SPRING_BOUNCY}`
          : `opacity ${FADE_IN_DURATION} ${SPRING_SMOOTH}`,
      }}
      ref={(el) => {
        if (el && (fadeIn || scaleIn)) {
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            if (scaleIn) el.style.transform = 'scale(1)';
          });
        }
      }}
    >
      <circle cx={cx} cy={cy} r={radius} fill={color} filter={`url(#${filterId})`} />
      {label && (
        <text
          x={cx + radius + 6}
          y={cy}
          fill={color}
          fontSize={13}
          dominantBaseline="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}
