import {Line, Node, NodeProps} from '@motion-canvas/2d';
import {createSignal, SignalValue, SimpleSignal} from '@motion-canvas/core';
import type {Mat2, Vec2} from '../math/linalg';
import {IDENTITY, mulMV} from '../math/linalg';
import {colors} from '../theme';

export interface CoordinateGridProps extends NodeProps {
  gridScale?: number;
  gridRange?: number;
  gridSegments?: number;
  transformT?: SignalValue<number>;
  matrix?: Mat2;
  gridColor?: string;
  axisColor?: string;
}

/**
 * Deformable coordinate grid.
 * Grid lines bend smoothly through a matrix transformation.
 *
 * Usage:
 *   <CoordinateGrid matrix={MATRIX} transformT={() => t()} />
 */
export class CoordinateGrid extends Node {
  public readonly tSignal: SimpleSignal<number>;
  private readonly mat: Mat2;
  private readonly _gridScale: number;
  private readonly _gridRange: number;

  public constructor(props: CoordinateGridProps) {
    super(props);

    this._gridScale = props.gridScale ?? 120;
    this._gridRange = props.gridRange ?? 5;
    this.mat = props.matrix ?? IDENTITY;
    const segs = props.gridSegments ?? 20;
    const gc = props.gridColor ?? colors.grid;
    const ac = props.axisColor ?? colors.axis;

    // External transform signal — bind from props or create internal
    this.tSignal = createSignal(0);
    if (typeof props.transformT === 'function') {
      // Will be read reactively via the points() closures below
    }

    const getT = typeof props.transformT === 'function'
      ? props.transformT as () => number
      : () => this.tSignal();

    // Grid lines
    for (let i = -this._gridRange; i <= this._gridRange; i++) {
      // Vertical
      this.add(
        <Line
          stroke={gc}
          lineWidth={1}
          opacity={0.7}
          points={() => this.linePoints(i, true, segs, getT())}
        />,
      );
      // Horizontal
      this.add(
        <Line
          stroke={gc}
          lineWidth={1}
          opacity={0.7}
          points={() => this.linePoints(i, false, segs, getT())}
        />,
      );
    }

    // Axes (brighter, with glow)
    this.add(
      <Line
        stroke={ac}
        lineWidth={2}
        shadowColor={ac}
        shadowBlur={6}
        points={() => this.linePoints(0, false, segs, getT())}
      />,
    );
    this.add(
      <Line
        stroke={ac}
        lineWidth={2}
        shadowColor={ac}
        shadowBlur={6}
        points={() => this.linePoints(0, true, segs, getT())}
      />,
    );
  }

  private linePoints(
    i: number,
    vertical: boolean,
    segs: number,
    t: number,
  ): [number, number][] {
    const s = this._gridScale;
    const r = this._gridRange;
    const step = (2 * r) / segs;
    const pts: [number, number][] = [];

    for (let j = 0; j <= segs; j++) {
      const p = -r + j * step;
      const mx = vertical ? i : p;
      const my = vertical ? p : i;
      const tr = mulMV(this.mat, [mx, my]);
      pts.push([
        (mx + (tr[0] - mx) * t) * s,
        -(my + (tr[1] - my) * t) * s,
      ]);
    }
    return pts;
  }
}
