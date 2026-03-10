'use client';

import {useMemo} from 'react';
import katex from 'katex';
import type {EquationElement, EnterAnimation} from '../../../types/animation';
import {FADE_IN_DURATION, SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: EquationElement;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
}

export function SvgEquation({element, isEntering, enterAnimation}: Props) {
  const {tex, position, color = '#E8E8F0', fontSize = 18} = element;

  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
      }),
    [tex],
  );

  const fadeIn = isEntering && (enterAnimation === 'fade-in' || enterAnimation === 'draw-in');

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
        transition: `opacity ${FADE_IN_DURATION} ${SPRING_SMOOTH}`,
        whiteSpace: 'nowrap',
      }}
      ref={(el) => {
        if (el && fadeIn) {
          requestAnimationFrame(() => (el.style.opacity = '1'));
        }
      }}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}
