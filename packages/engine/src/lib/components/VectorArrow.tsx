import {Line, Node, NodeProps} from '@motion-canvas/2d';
import {createRef, createSignal, SimpleSignal} from '@motion-canvas/core';
import {springBouncy} from '../motion/spring';

export interface VectorArrowProps extends NodeProps {
  from?: [number, number];
  to?: [number, number];
  arrowScale?: number;
  arrowColor?: string;
  arrowWidth?: number;
  headSize?: number;
  glowBlur?: number;
  drawProgress?: number;
}

/**
 * Physics-based vector arrow with glow.
 *
 * Usage:
 *   <VectorArrow to={[1, 2]} arrowColor={colors.eigen1} />
 */
export class VectorArrow extends Node {
  private readonly lineRef = createRef<Line>();
  private readonly _from: [number, number];
  private readonly _scale: number;
  public readonly toSignal: SimpleSignal<[number, number]>;
  public readonly progressSignal: SimpleSignal<number>;

  public constructor(props: VectorArrowProps) {
    super(props);

    this._from = props.from ?? [0, 0];
    this._scale = props.arrowScale ?? 120;
    this.toSignal = createSignal(props.to ?? [1, 0]);
    this.progressSignal = createSignal(props.drawProgress ?? 1);

    const color = props.arrowColor ?? '#ffffff';

    this.add(
      <Line
        ref={this.lineRef}
        stroke={color}
        lineWidth={props.arrowWidth ?? 3}
        endArrow
        arrowSize={props.headSize ?? 12}
        end={() => this.progressSignal()}
        shadowColor={color}
        shadowBlur={props.glowBlur ?? 10}
        lineCap="round"
        points={() => {
          const [fx, fy] = this._from;
          const [tx, ty] = this.toSignal();
          const s = this._scale;
          // 4 intermediate points for smooth appearance
          const pts: [number, number][] = [];
          for (let i = 0; i <= 4; i++) {
            const f = i / 4;
            pts.push([
              (fx + (tx - fx) * f) * s,
              -(fy + (ty - fy) * f) * s,
            ]);
          }
          return pts;
        }}
      />,
    );
  }

  /** Draw from 0→1 with spring */
  public *drawIn(duration: number) {
    this.progressSignal(0);
    yield* this.progressSignal(1, duration, springBouncy);
  }

  /** Animate to new tip */
  public *animateTo(newTo: [number, number], duration: number) {
    yield* this.toSignal(newTo, duration, springBouncy);
  }
}
