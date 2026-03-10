'use client';

import {useRef, useEffect} from 'react';
import type {VectorElement} from '../../../types/animation';
import type {EnterAnimation} from '../../../types/animation';
import {DRAW_IN_DURATION, SPRING_BOUNCY, FADE_IN_DURATION, SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: VectorElement;
  gridScale: number;
  isEntering: boolean;
  enterAnimation: EnterAnimation;
  filterId: string;
  highlightPulse?: {color: string; pulseCount: number};
}

export function SvgVector({element, gridScale, isEntering, enterAnimation, filterId, highlightPulse}: Props) {
  const {from, to, color, label, width = 2.5} = element;
  const lineRef = useRef<SVGLineElement>(null);

  const x1 = from[0] * gridScale;
  const y1 = -from[1] * gridScale;
  const x2 = to[0] * gridScale;
  const y2 = -to[1] * gridScale;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  // Arrowhead at tip
  const headLen = 10;
  const headAngle = 0.4;
  const angle = Math.atan2(dy, dx);
  const ax1 = x2 - headLen * Math.cos(angle - headAngle);
  const ay1 = y2 - headLen * Math.sin(angle - headAngle);
  const ax2 = x2 - headLen * Math.cos(angle + headAngle);
  const ay2 = y2 - headLen * Math.sin(angle + headAngle);

  // Label position: offset from tip
  const labelX = x2 + 12 * Math.cos(angle);
  const labelY = y2 + 12 * Math.sin(angle);

  const drawIn = isEntering && enterAnimation === 'draw-in';
  const fadeIn = isEntering && enterAnimation === 'fade-in';

  // Draw-in animation via stroke-dashoffset
  useEffect(() => {
    const line = lineRef.current;
    if (!line || !drawIn) return;
    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;
    requestAnimationFrame(() => {
      line.style.transition = `stroke-dashoffset ${DRAW_IN_DURATION} ${SPRING_BOUNCY}`;
      line.style.strokeDashoffset = '0';
    });
  }, [drawIn, len]);

  const pulseStyle: React.CSSProperties = highlightPulse
    ? {
        filter: `drop-shadow(0 0 8px ${highlightPulse.color})`,
        animation: `vectorPulse 0.6s ease-in-out ${highlightPulse.pulseCount} alternate`,
      }
    : {};

  return (
    <g
      style={{
        opacity: fadeIn ? 0 : 1,
        transition: fadeIn ? `opacity ${FADE_IN_DURATION} ${SPRING_SMOOTH}` : undefined,
        ...pulseStyle,
      }}
      ref={(el) => {
        if (el && fadeIn) {
          requestAnimationFrame(() => (el.style.opacity = '1'));
        }
      }}
    >
      {/* Line */}
      <line
        ref={lineRef}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
      />
      {/* Arrowhead */}
      <polygon
        points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`}
        fill={color}
        style={{
          opacity: drawIn ? 0 : 1,
          transition: `opacity 0.3s ease 0.5s`,
        }}
        ref={(el) => {
          if (el && drawIn) {
            requestAnimationFrame(() => (el.style.opacity = '1'));
          }
        }}
      />
      {/* Label */}
      {label && (
        <text
          x={labelX}
          y={labelY}
          fill={color}
          fontSize={16}
          fontWeight={600}
          fontStyle="italic"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            opacity: drawIn ? 0 : 1,
            transition: `opacity 0.3s ease 0.6s`,
          }}
          ref={(el) => {
            if (el && drawIn) {
              requestAnimationFrame(() => (el.style.opacity = '1'));
            }
          }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
