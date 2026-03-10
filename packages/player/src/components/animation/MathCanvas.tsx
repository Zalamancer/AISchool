'use client';

import type {AnimationElement, EnterAnimation, GridElement} from '../../types/animation';
import type {HighlightPulse} from '../../hooks/useAnimationEngine';
import {SvgGrid} from './elements/SvgGrid';
import {SvgVector} from './elements/SvgVector';
import {SvgAngleArc} from './elements/SvgAngleArc';
import {SvgPoint} from './elements/SvgPoint';
import {SvgEquation} from './elements/SvgEquation';
import {SvgFunctionCurve} from './elements/SvgFunctionCurve';
import {SvgCaption} from './elements/SvgCaption';
import {CinematicText} from './elements/CinematicText';
import {EquationSequence} from './elements/EquationSequence';

interface Props {
  elements: AnimationElement[];
  enteringElements: Map<string, EnterAnimation>;
  highlightElements?: Map<string, HighlightPulse>;
  stageProgress?: number;
  viewBox?: {xMin: number; xMax: number; yMin: number; yMax: number};
}

const GLOW_FILTER_ID = 'glow';
const DEFAULT_GRID_SCALE = 60;

function renderSvgElement(
  el: AnimationElement,
  gridScale: number,
  enteringElements: Map<string, EnterAnimation>,
  highlightElements?: Map<string, {color: string; pulseCount: number}>,
) {
  const isEntering = enteringElements.has(el.id);
  const enterAnim = enteringElements.get(el.id) ?? 'none';

  switch (el.type) {
    case 'grid':
      return (
        <SvgGrid
          key={el.id}
          element={el as GridElement}
          gridScale={gridScale}
          isEntering={isEntering}
        />
      );
    case 'vector':
      return (
        <SvgVector
          key={el.id}
          element={el}
          gridScale={gridScale}
          isEntering={isEntering}
          enterAnimation={enterAnim}
          filterId={GLOW_FILTER_ID}
          highlightPulse={highlightElements?.get(el.id)}
        />
      );
    case 'angle-arc':
      return (
        <SvgAngleArc
          key={el.id}
          element={el}
          gridScale={gridScale}
          isEntering={isEntering}
          enterAnimation={enterAnim}
        />
      );
    case 'point':
      return (
        <SvgPoint
          key={el.id}
          element={el}
          gridScale={gridScale}
          isEntering={isEntering}
          enterAnimation={enterAnim}
          filterId={GLOW_FILTER_ID}
        />
      );
    case 'function-curve':
      return (
        <SvgFunctionCurve
          key={el.id}
          element={el}
          gridScale={gridScale}
          isEntering={isEntering}
          enterAnimation={enterAnim}
          filterId={GLOW_FILTER_ID}
        />
      );
    default:
      return null;
  }
}

export function MathCanvas({elements, enteringElements, highlightElements, stageProgress = 0, viewBox}: Props) {
  const vb = viewBox ?? {xMin: -6, xMax: 6, yMin: -4.5, yMax: 4.5};
  const gridScale = DEFAULT_GRID_SCALE;
  const svgW = (vb.xMax - vb.xMin) * gridScale;
  const svgH = (vb.yMax - vb.yMin) * gridScale;
  const cx = ((vb.xMin + vb.xMax) / 2) * gridScale;
  const cy = -((vb.yMin + vb.yMax) / 2) * gridScale;

  const OVERLAY_TYPES = new Set(['equation', 'caption', 'cinematic-text', 'equation-sequence']);
  const equationElements = elements.filter((e) => e.type === 'equation');
  const captionElements = elements.filter((e) => e.type === 'caption');
  const cinematicTextElements = elements.filter((e) => e.type === 'cinematic-text');
  const eqSequenceElements = elements.filter((e) => e.type === 'equation-sequence');
  const svgElements = elements.filter((e) => !OVERLAY_TYPES.has(e.type));

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0D0D1A',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`${-svgW / 2 + cx} ${-svgH / 2 + cy} ${svgW} ${svgH}`}
        width="100%"
        height="100%"
        style={{display: 'block'}}
      >
        <defs>
          <filter id={GLOW_FILTER_ID} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`@keyframes vectorPulse { from { opacity: 0.6; } to { opacity: 1; } }`}</style>
        </defs>
        {svgElements.map((el) => renderSvgElement(el, gridScale, enteringElements, highlightElements))}
      </svg>

      {equationElements.map((el) => {
        if (el.type !== 'equation') return null;
        const isEntering = enteringElements.has(el.id);
        const enterAnim = enteringElements.get(el.id) ?? 'none';
        return (
          <SvgEquation
            key={el.id}
            element={el}
            isEntering={isEntering}
            enterAnimation={enterAnim}
          />
        );
      })}

      {captionElements.map((el) => {
        if (el.type !== 'caption') return null;
        const isEntering = enteringElements.has(el.id);
        const enterAnim = enteringElements.get(el.id) ?? 'none';
        return (
          <SvgCaption
            key={el.id}
            element={el}
            isEntering={isEntering}
            enterAnimation={enterAnim}
          />
        );
      })}

      {cinematicTextElements.map((el) => {
        if (el.type !== 'cinematic-text') return null;
        const isEntering = enteringElements.has(el.id);
        const enterAnim = enteringElements.get(el.id) ?? 'none';
        return (
          <CinematicText
            key={el.id}
            element={el}
            isEntering={isEntering}
            enterAnimation={enterAnim}
            stageProgress={stageProgress}
          />
        );
      })}

      {eqSequenceElements.map((el) => {
        if (el.type !== 'equation-sequence') return null;
        const isEntering = enteringElements.has(el.id);
        const enterAnim = enteringElements.get(el.id) ?? 'none';
        return (
          <EquationSequence
            key={el.id}
            element={el}
            isEntering={isEntering}
            enterAnimation={enterAnim}
            stageProgress={stageProgress}
          />
        );
      })}
    </div>
  );
}
