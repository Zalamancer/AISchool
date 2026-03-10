/** Animation timeline data types for the animated solver */

export type EnterAnimation = 'draw-in' | 'fade-in' | 'scale-in' | 'typewriter' | 'none';

export type ElementType =
  | 'grid'
  | 'vector'
  | 'point'
  | 'angle-arc'
  | 'function-curve'
  | 'shaded-region'
  | 'equation'
  | 'label'
  | 'caption'
  | 'cinematic-text'
  | 'equation-sequence';

// ---- Element definitions ----

interface BaseElement {
  id: string;
  type: ElementType;
}

export interface GridElement extends BaseElement {
  type: 'grid';
  gridScale: number;
  gridRange: number;
  gridColor: string;
  axisColor: string;
}

export interface VectorElement extends BaseElement {
  type: 'vector';
  from: [number, number];
  to: [number, number];
  color: string;
  label?: string;
  width?: number;
  headSize?: number;
}

export interface PointElement extends BaseElement {
  type: 'point';
  position: [number, number];
  color: string;
  radius?: number;
  label?: string;
}

export interface AngleArcElement extends BaseElement {
  type: 'angle-arc';
  center: [number, number];
  startAngle: number;
  endAngle: number;
  radius: number;
  color: string;
  label?: string;
}

export interface FunctionCurveElement extends BaseElement {
  type: 'function-curve';
  points: [number, number][];
  color: string;
  width?: number;
}

export interface ShadedRegionElement extends BaseElement {
  type: 'shaded-region';
  points: [number, number][];
  color: string;
  opacity?: number;
}

export interface EquationElement extends BaseElement {
  type: 'equation';
  tex: string;
  position: [number, number];
  color?: string;
  fontSize?: number;
}

export interface LabelElement extends BaseElement {
  type: 'label';
  text: string;
  position: [number, number];
  color?: string;
  fontSize?: number;
}

export interface CaptionLine {
  /** Text content — may contain $LaTeX$ */
  text: string;
  /** Style variant */
  style: 'heading' | 'body' | 'math' | 'highlight';
  /** Delay in ms before this line appears (staggered fade-in) */
  delayMs?: number;
}

export interface CaptionElement extends BaseElement {
  type: 'caption';
  lines: CaptionLine[];
  /** Position within canvas. Default 'bottom'. */
  placement?: 'bottom' | 'top' | 'center';
  /** Background color. Default 'rgba(13,13,26,0.85)' */
  bgColor?: string;
  /** Max width as percentage of canvas. Default 90. */
  maxWidthPct?: number;
}

export interface CinematicTextElement extends BaseElement {
  type: 'cinematic-text';
  text: string;
  position: [number, number];
  style: 'heading' | 'body' | 'accent' | 'definition';
  color?: string;
  fontSize?: number;
  maxWidthPx?: number;
  anchor?: 'center' | 'left' | 'right';
  /** If true, render in the side TextPanel instead of canvas overlay. */
  panel?: boolean;
}

export interface EquationStep {
  tex: string;
  highlightColor?: string;
  /** Relative duration weight. Default 1. */
  weight?: number;
}

export interface EquationSequenceElement extends BaseElement {
  type: 'equation-sequence';
  steps: EquationStep[];
  position: [number, number];
  color?: string;
  fontSize?: number;
  /** If true, render in the side TextPanel instead of canvas overlay. */
  panel?: boolean;
  /** 'crossfade' (default) swaps whole equations; 'typewriter' reveals letter-by-letter. */
  revealMode?: 'crossfade' | 'typewriter';
}

export type AnimationElement =
  | GridElement
  | VectorElement
  | PointElement
  | AngleArcElement
  | FunctionCurveElement
  | ShadedRegionElement
  | EquationElement
  | LabelElement
  | CaptionElement
  | CinematicTextElement
  | EquationSequenceElement;

// ---- Stage / Timeline ----

export interface StageElement {
  elementId: string;
  enter?: EnterAnimation;
  highlight?: {color?: string; pulseCount?: number};
}

export interface AnimationStage {
  title: string;
  narration: string;
  /** Plain-text narration for TTS (no LaTeX). */
  narrationPlainText?: string;
  durationMs?: number;
  elements: StageElement[];
  /** If false, the graph pane hides and the text panel takes full width. Default true. */
  showGraph?: boolean;
}

export interface AnimationTimeline {
  elements: AnimationElement[];
  stages: AnimationStage[];
  viewBox?: {xMin: number; xMax: number; yMin: number; yMax: number};
}
