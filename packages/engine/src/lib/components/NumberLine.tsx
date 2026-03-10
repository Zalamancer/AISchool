import {Circle, Line, Node, NodeProps, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  Reference,
  SimpleSignal,
} from '@motion-canvas/core';
import {springBouncy, springSmooth} from '../motion/spring';
import {colors, fonts} from '../theme';

export interface NumberLineProps extends NodeProps {
  lineRange?: [number, number];
  lineScale?: number;
  tickInterval?: number;
  showLabels?: boolean;
  lineColor?: string;
  tickColor?: string;
  labelColor?: string;
  labelSize?: number;
}

/**
 * Animated 1D number line with tick marks, labels, and point markers.
 *
 * Usage:
 *   <NumberLine lineRange={[-5, 5]} lineScale={120} />
 *
 *   yield* numberLine.drawIn(0.8);
 *   const pt = numberLine.addPoint(3, colors.variable, 'x');
 *   yield* numberLine.animatePoint(pt, -2, 0.6);
 *   yield* numberLine.highlightRegion(1, 4, colors.geoPrimary, 0.5);
 */
export class NumberLine extends Node {
  private readonly _lineRange: [number, number];
  private readonly _lineScale: number;
  private readonly _tickInterval: number;
  private readonly _showLabels: boolean;
  private readonly _lineColor: string;
  private readonly _tickColor: string;
  private readonly _labelColor: string;
  private readonly _labelSize: number;

  private readonly axisRef = createRef<Line>();
  public readonly drawProgress: SimpleSignal<number>;

  /** Tracks all added point signals by ref for animation */
  private readonly pointSignals = new Map<
    Reference<Circle>,
    SimpleSignal<number>
  >();

  public constructor(props: NumberLineProps) {
    super(props);

    this._lineRange = props.lineRange ?? [-5, 5];
    this._lineScale = props.lineScale ?? 120;
    this._tickInterval = props.tickInterval ?? 1;
    this._showLabels = props.showLabels ?? true;
    this._lineColor = props.lineColor ?? colors.axis;
    this._tickColor = props.tickColor ?? colors.axis;
    this._labelColor = props.labelColor ?? colors.text;
    this._labelSize = props.labelSize ?? 14;

    this.drawProgress = createSignal(1);

    const [rangeMin, rangeMax] = this._lineRange;
    const s = this._lineScale;

    // Main horizontal axis line with arrow
    this.add(
      <Line
        ref={this.axisRef}
        stroke={this._lineColor}
        lineWidth={2}
        endArrow
        startArrow
        arrowSize={10}
        end={() => this.drawProgress()}
        shadowColor={this._lineColor}
        shadowBlur={4}
        lineCap="round"
        points={[
          [rangeMin * s, 0],
          [rangeMax * s, 0],
        ]}
      />,
    );

    // Tick marks and labels
    for (
      let v = rangeMin;
      v <= rangeMax;
      v = Math.round((v + this._tickInterval) * 1e8) / 1e8
    ) {
      const xPos = v * s;
      const tickHeight = 8;

      // Tick mark
      this.add(
        <Line
          stroke={this._tickColor}
          lineWidth={1.5}
          opacity={() => this.drawProgress()}
          points={[
            [xPos, -tickHeight],
            [xPos, tickHeight],
          ]}
        />,
      );

      // Label below tick
      if (this._showLabels) {
        this.add(
          <Txt
            text={Number.isInteger(v) ? v.toString() : v.toFixed(1)}
            fill={this._labelColor}
            fontFamily={fonts.label}
            fontSize={this._labelSize}
            opacity={() => this.drawProgress()}
            x={xPos}
            y={tickHeight + 14}
          />,
        );
      }
    }
  }

  /**
   * Add a circular point marker at the given value on the number line.
   *
   * @param value   Position on the number line
   * @param color   Fill color of the point
   * @param label   Optional text label displayed above the point
   * @returns       Reference to the Circle node
   */
  public addPoint(
    value: number,
    color: string,
    label?: string,
  ): Reference<Circle> {
    const ref = createRef<Circle>();
    const valueSignal = createSignal(value);
    const s = this._lineScale;

    const pointNode = (
      <Circle
        ref={ref}
        x={() => valueSignal() * s}
        y={0}
        width={12}
        height={12}
        fill={color}
        shadowColor={color}
        shadowBlur={8}
      />
    ) as Circle;

    this.add(pointNode);

    // Optional label above point
    if (label) {
      this.add(
        <Txt
          text={label}
          fill={color}
          fontFamily={fonts.label}
          fontSize={this._labelSize}
          x={() => valueSignal() * s}
          y={-18}
        />,
      );
    }

    this.pointSignals.set(ref, valueSignal);
    return ref;
  }

  /**
   * Animate a point marker to a new value with springBouncy easing.
   *
   * @param pointRef  Reference returned by addPoint()
   * @param newValue  Target position on the number line
   * @param duration  Animation duration in seconds
   */
  public *animatePoint(
    pointRef: Reference<Circle>,
    newValue: number,
    duration: number,
  ) {
    const sig = this.pointSignals.get(pointRef);
    if (!sig) return;
    yield* sig(newValue, duration, springBouncy);
  }

  /**
   * Draw the number line from center outward.
   * Sets progress from 0 to 1 with spring easing.
   *
   * @param duration  Animation duration in seconds
   */
  public *drawIn(duration: number) {
    this.drawProgress(0);
    yield* this.drawProgress(1, duration, springSmooth);
  }

  /**
   * Highlight a region on the number line with a colored rectangle.
   *
   * @param from      Start value of the region
   * @param to        End value of the region
   * @param color     Fill color (rendered at low opacity)
   * @param duration  Animation duration in seconds
   */
  public *highlightRegion(
    from: number,
    to: number,
    color: string,
    duration: number,
  ) {
    const s = this._lineScale;
    const xStart = Math.min(from, to) * s;
    const width = Math.abs(to - from) * s;
    const regionRef = createRef<Rect>();

    this.add(
      <Rect
        ref={regionRef}
        x={xStart + width / 2}
        y={0}
        width={0}
        height={20}
        fill={color}
        opacity={0.25}
        radius={4}
      />,
    );

    yield* all(
      regionRef().width(width, duration, springSmooth),
      regionRef().opacity(0.25, duration * 0.3),
    );
  }
}
