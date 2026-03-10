'use client';

import type {GridElement} from '../../../types/animation';
import {FADE_IN_DURATION, SPRING_SMOOTH} from '../../../lib/easing';

interface Props {
  element: GridElement;
  gridScale: number;
  isEntering: boolean;
}

export function SvgGrid({element, gridScale, isEntering}: Props) {
  const {gridRange, gridColor, axisColor} = element;
  const lines: React.ReactNode[] = [];
  const s = gridScale;

  // Grid lines
  for (let i = -gridRange; i <= gridRange; i++) {
    if (i === 0) continue;
    // Vertical
    lines.push(
      <line
        key={`v${i}`}
        x1={i * s}
        y1={-gridRange * s}
        x2={i * s}
        y2={gridRange * s}
        stroke={gridColor}
        strokeWidth={0.5}
      />,
    );
    // Horizontal
    lines.push(
      <line
        key={`h${i}`}
        x1={-gridRange * s}
        y1={i * s}
        x2={gridRange * s}
        y2={i * s}
        stroke={gridColor}
        strokeWidth={0.5}
      />,
    );
  }

  // Tick labels
  const labels: React.ReactNode[] = [];
  for (let i = -gridRange; i <= gridRange; i++) {
    if (i === 0) continue;
    labels.push(
      <text
        key={`lx${i}`}
        x={i * s}
        y={14}
        fill={axisColor}
        fontSize={11}
        textAnchor="middle"
        dominantBaseline="hanging"
      >
        {i}
      </text>,
    );
    labels.push(
      <text
        key={`ly${i}`}
        x={-10}
        y={-i * s}
        fill={axisColor}
        fontSize={11}
        textAnchor="end"
        dominantBaseline="middle"
      >
        {i}
      </text>,
    );
  }

  return (
    <g
      style={{
        opacity: isEntering ? 0 : 1,
        transition: `opacity ${FADE_IN_DURATION} ${SPRING_SMOOTH}`,
      }}
      ref={(el) => {
        if (el && isEntering) {
          requestAnimationFrame(() => (el.style.opacity = '1'));
        }
      }}
    >
      {lines}
      {/* X axis */}
      <line
        x1={-gridRange * s}
        y1={0}
        x2={gridRange * s}
        y2={0}
        stroke={axisColor}
        strokeWidth={1.5}
      />
      {/* Y axis */}
      <line
        x1={0}
        y1={-gridRange * s}
        x2={0}
        y2={gridRange * s}
        stroke={axisColor}
        strokeWidth={1.5}
      />
      {/* Axis arrows */}
      <polygon points={`${gridRange * s},0 ${gridRange * s - 6},-4 ${gridRange * s - 6},4`} fill={axisColor} />
      <polygon points={`0,${-gridRange * s} -4,${-gridRange * s + 6} 4,${-gridRange * s + 6}`} fill={axisColor} />
      {labels}
    </g>
  );
}
