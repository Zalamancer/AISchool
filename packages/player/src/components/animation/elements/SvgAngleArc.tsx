'use client';

import {useRef, useEffect} from 'react';
import type {AngleArcElement, EnterAnimation} from '../../../types/animation';
import {DRAW_IN_DURATION, SPRING_BOUNCY, FADE_IN_DURATION, SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: AngleArcElement;
  gridScale: number;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
}

export function SvgAngleArc({element, gridScale, isEntering, enterAnimation}: Props) {
  const {center, startAngle, endAngle, radius, color, label} = element;
  const pathRef = useRef<SVGPathElement>(null);

  const cx = center[0] * gridScale;
  const cy = -center[1] * gridScale;
  const r = radius * gridScale;

  // SVG arc: angles are measured clockwise from positive x, but we flip y
  const sx = cx + r * Math.cos(-startAngle);
  const sy = cy + r * Math.sin(-startAngle);
  const ex = cx + r * Math.cos(-endAngle);
  const ey = cy + r * Math.sin(-endAngle);

  const sweep = endAngle - startAngle;
  const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
  const sweepFlag = sweep > 0 ? 0 : 1; // flipped due to y-inversion

  const d = `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`;

  // Label at midpoint of arc
  const midAngle = (startAngle + endAngle) / 2;
  const labelR = r + 14;
  const lx = cx + labelR * Math.cos(-midAngle);
  const ly = cy + labelR * Math.sin(-midAngle);

  const drawIn = isEntering && enterAnimation === 'draw-in';
  const fadeIn = isEntering && (enterAnimation === 'fade-in' || enterAnimation === 'none');

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
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.8}
      />
      {label && (
        <text
          x={lx}
          y={ly}
          fill={color}
          fontSize={14}
          fontStyle="italic"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}
