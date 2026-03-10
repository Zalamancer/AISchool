import {Line, Node, NodeProps} from '@motion-canvas/2d';
import {createRef, createSignal, SimpleSignal} from '@motion-canvas/core';
import {springBouncy} from '../motion/spring';
import {colors} from '../theme';

export interface FunctionPlotProps extends NodeProps {
  /** y = fn(x) — standard function to plot */
  fn?: (x: number) => number;
  /** Parametric alternative: t -> [x, y] */
  paramFn?: (t: number) => [number, number];
  /** x-domain for fn, or t-domain for paramFn (default [-5, 5]) */
  domain?: [number, number];
  /** Number of sample points along the domain (default 200) */
  samples?: number;
  /** Pixels per unit (default 120) */
  plotScale?: number;
  /** Stroke color (default colors.geoPrimary) */
  curveColor?: string;
  /** Stroke width (default 3) */
  curveWidth?: number;
  /** Shadow glow blur radius (default 8) */
  glowBlur?: number;
  /** Initial draw progress 0-1 (default 1) */
  drawProgress?: number;
}

/**
 * Parametric / standard function curve with glow and draw-in animation.
 *
 * Renders a smooth curve by sampling `fn` or `paramFn` over the given domain,
 * converting to screen coordinates via `plotScale` (y is flipped).
 *
 * Usage:
 * ```tsx
 *   // Standard function
 *   const plot = createRef<FunctionPlot>();
 *   <FunctionPlot
 *     ref={plot}
 *     fn={(x) => Math.sin(x)}
 *     domain={[-Math.PI, Math.PI]}
 *     curveColor={colors.function}
 *   />
 *
 *   // Draw-in animation
 *   yield* plot().drawIn(1.2);
 *
 *   // Morph to a new function
 *   yield* plot().morphTo((x) => Math.cos(x), 1.0);
 *
 *   // Parametric curve
 *   <FunctionPlot
 *     paramFn={(t) => [Math.cos(t), Math.sin(t)]}
 *     domain={[0, 2 * Math.PI]}
 *     curveColor={colors.geoSecondary}
 *   />
 * ```
 */
export class FunctionPlot extends Node {
  private readonly lineRef = createRef<Line>();

  private readonly _domain: [number, number];
  private readonly _samples: number;
  private readonly _plotScale: number;

  /** Current function — mutated by morphTo */
  private _fn: ((x: number) => number) | null;
  /** Current parametric function — mutated by morphTo */
  private _paramFn: ((t: number) => [number, number]) | null;

  /** Controls Line.end for draw-in animation (0 = hidden, 1 = fully drawn) */
  public readonly drawProgressSignal: SimpleSignal<number>;

  /**
   * Internal signal bumped to force reactive recalculation of points
   * when the function reference changes (since closures are not reactive).
   */
  private readonly _fnVersion: SimpleSignal<number>;

  public constructor(props: FunctionPlotProps) {
    super(props);

    this._domain = props.domain ?? [-5, 5];
    this._samples = props.samples ?? 200;
    this._plotScale = props.plotScale ?? 120;
    this._fn = props.fn ?? null;
    this._paramFn = props.paramFn ?? null;

    // Fall back to y = 0 if neither fn nor paramFn provided
    if (!this._fn && !this._paramFn) {
      this._fn = () => 0;
    }

    this.drawProgressSignal = createSignal(props.drawProgress ?? 1);
    this._fnVersion = createSignal(0);

    const curveColor = props.curveColor ?? colors.geoPrimary;

    this.add(
      <Line
        ref={this.lineRef}
        stroke={curveColor}
        lineWidth={props.curveWidth ?? 3}
        lineJoin="round"
        lineCap="round"
        end={() => this.drawProgressSignal()}
        shadowColor={curveColor}
        shadowBlur={props.glowBlur ?? 8}
        points={() => {
          // Read fnVersion to establish reactive dependency
          this._fnVersion();
          return this.computePoints();
        }}
      />,
    );
  }

  /**
   * Sample the current function and return screen-space points.
   */
  private computePoints(): [number, number][] {
    const [a, b] = this._domain;
    const n = this._samples;
    const s = this._plotScale;
    const pts: [number, number][] = [];

    if (this._paramFn) {
      for (let i = 0; i <= n; i++) {
        const t = a + (b - a) * (i / n);
        const [px, py] = this._paramFn(t);
        pts.push([px * s, -py * s]);
      }
    } else if (this._fn) {
      for (let i = 0; i <= n; i++) {
        const x = a + (b - a) * (i / n);
        const y = this._fn(x);
        pts.push([x * s, -y * s]);
      }
    }

    return pts;
  }

  /**
   * Animate draw progress from 0 to 1 with a bouncy spring.
   *
   * @param duration Animation duration in seconds
   */
  public *drawIn(duration: number) {
    this.drawProgressSignal(0);
    yield* this.drawProgressSignal(1, duration, springBouncy);
  }

  /**
   * Smoothly morph the curve to a new standard function.
   *
   * Captures the current output at every sample point, then interpolates
   * between the old and new y-values over the given duration using a
   * bouncy spring.
   *
   * @param newFn  The target function y = newFn(x)
   * @param duration Animation duration in seconds
   */
  public *morphTo(newFn: (x: number) => number, duration: number) {
    const [a, b] = this._domain;
    const n = this._samples;

    // Snapshot old y-values at each sample
    const oldValues: number[] = [];
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * (i / n);
      if (this._paramFn) {
        const [, py] = this._paramFn(x);
        oldValues.push(py);
      } else if (this._fn) {
        oldValues.push(this._fn(x));
      } else {
        oldValues.push(0);
      }
    }

    // New y-values
    const newValues: number[] = [];
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * (i / n);
      newValues.push(newFn(x));
    }

    // Create an interpolation signal
    const morphT = createSignal(0);

    // Replace the function with one that blends old -> new based on morphT
    this._paramFn = null;
    this._fn = (x: number) => {
      const t = morphT();
      // Find the closest sample index for this x
      const frac = (x - a) / (b - a);
      const idx = Math.round(frac * n);
      const ci = Math.max(0, Math.min(n, idx));
      return oldValues[ci] + (newValues[ci] - oldValues[ci]) * t;
    };
    this._fnVersion(this._fnVersion() + 1);

    // Animate the interpolation
    yield* morphT(1, duration, springBouncy);

    // Commit the final function so future evaluations are exact
    this._fn = newFn;
    this._paramFn = null;
    this._fnVersion(this._fnVersion() + 1);
  }
}
