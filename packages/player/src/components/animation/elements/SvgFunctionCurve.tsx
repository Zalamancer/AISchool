'use client';

import {useRef, useEffect} from 'react';
import type {FunctionCurveElement, EnterAnimation} from '../../../types/animation';
import {DRAW_IN_DURATION, SPRING_BOUNCY, FADE_IN_DURATION, SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: FunctionCurveElement;
  gridScale: number;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
  filterId: string;
}

export function SvgFunctionCurve({element, gridScale, isEntering, enterAnimation, filterId}: Props) {
  const {points, color, width = 2.5} = element;
  const pathRef = useRef<SVGPolylineElement>(null);

  const svgPoints = points.map(([x, y]) => `${x * gridScale},${-y * gridScale}`).join(' ');

  const drawIn = isEntering && enterAnimation === 'draw-in';
  const fadeIn = isEntering && enterAnimation === 'fade-in';

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !drawIn) return;
    const totalLen = path.getTotalLength();
    path.style.strokeDasharray = `${totalLen}`;
    path.style.strokeDashoffset = `${totalLen}`;
    requestAnimationFrame(() => {
      path.style.transition = `stroke-dashoffset ${DRAW_IN_DURATION} ${SPRING_BOUNCY}`;
      path.style.strokeDashoffset = '0';
    });
  }, [drawIn]);

  return (
    <g
      style={{
        opacity: fadeIn ? 0 : 1,
        transition: fadeIn ? `opacity ${FADE_IN_DURATION} ${SPRING_SMOOTH}` : undefined,
      }}
      ref={(el) => {
        if (el && fadeIn) {
          requestAnimationFrame(() => (el.style.opacity = '1'));
        }
      }}
    >
      <polyline
        ref={pathRef}
        points={svgPoints}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
      />
    </g>
  );
}
