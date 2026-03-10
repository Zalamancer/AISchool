import {Line, Node, NodeProps, Txt} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  createSignal,
  Reference,
  SimpleSignal,
  ThreadGenerator,
  waitFor,
} from '@motion-canvas/core';
import {springBouncy, springSmooth} from '../motion/spring';
import {colors, fonts} from '../theme';

export interface MatrixDisplayProps extends NodeProps {
  values: number[][];
  cellSize?: number;
  bracketColor?: string;
  cellColor?: string;
  fontSize?: number;
  glowBlur?: number;
}

/**
 * Animated matrix display with brackets, cell-level highlighting,
 * and row/column operation animations.
 *
 * Usage:
 *   <MatrixDisplay
 *     values={[[1, 2], [3, 4]]}
 *     cellSize={60}
 *     cellColor={colors.constant}
 *   />
 */
export class MatrixDisplay extends Node {
  private readonly cellRefs: Reference<Txt>[][];
  private readonly cellValues: SimpleSignal<number>[][];
  private readonly cellColorSignals: SimpleSignal<string>[][];
  private readonly cellYOffsets: SimpleSignal<number>[][];
  private readonly rows: number;
  private readonly cols: number;
  private readonly _cellSize: number;
  private readonly _bracketColor: string;
  private readonly _cellColor: string;
  private readonly _fontSize: number;
  private readonly _glowBlur: number;
  private readonly leftBracketRef = createRef<Line>();
  private readonly rightBracketRef = createRef<Line>();

  public constructor(props: MatrixDisplayProps) {
    super(props);

    const values = props.values;
    this.rows = values.length;
    this.cols = values.length > 0 ? values[0].length : 0;
    this._cellSize = props.cellSize ?? 60;
    this._bracketColor = props.bracketColor ?? colors.operator;
    this._cellColor = props.cellColor ?? colors.constant;
    this._fontSize = props.fontSize ?? 24;
    this._glowBlur = props.glowBlur ?? 0;

    // Initialize 2D arrays for refs and signals
    this.cellRefs = [];
    this.cellValues = [];
    this.cellColorSignals = [];
    this.cellYOffsets = [];

    for (let r = 0; r < this.rows; r++) {
      this.cellRefs[r] = [];
      this.cellValues[r] = [];
      this.cellColorSignals[r] = [];
      this.cellYOffsets[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.cellRefs[r][c] = createRef<Txt>();
        this.cellValues[r][c] = createSignal(values[r][c]);
        this.cellColorSignals[r][c] = createSignal(this._cellColor);
        this.cellYOffsets[r][c] = createSignal(0);
      }
    }

    const totalWidth = this.cols * this._cellSize;
    const totalHeight = this.rows * this._cellSize;
    const bracketWidth = 10;
    const bracketInset = 4;

    // Left bracket [
    this.add(
      <Line
        ref={this.leftBracketRef}
        stroke={this._bracketColor}
        lineWidth={2.5}
        lineCap="round"
        lineJoin="round"
        points={[
          [-totalWidth / 2 - bracketWidth + bracketInset, -totalHeight / 2 - bracketInset],
          [-totalWidth / 2 - bracketWidth, -totalHeight / 2 - bracketInset],
          [-totalWidth / 2 - bracketWidth, totalHeight / 2 + bracketInset],
          [-totalWidth / 2 - bracketWidth + bracketInset, totalHeight / 2 + bracketInset],
        ]}
      />,
    );

    // Right bracket ]
    this.add(
      <Line
        ref={this.rightBracketRef}
        stroke={this._bracketColor}
        lineWidth={2.5}
        lineCap="round"
        lineJoin="round"
        points={[
          [totalWidth / 2 + bracketWidth - bracketInset, -totalHeight / 2 - bracketInset],
          [totalWidth / 2 + bracketWidth, -totalHeight / 2 - bracketInset],
          [totalWidth / 2 + bracketWidth, totalHeight / 2 + bracketInset],
          [totalWidth / 2 + bracketWidth - bracketInset, totalHeight / 2 + bracketInset],
        ]}
      />,
    );

    // Render cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x =
          -totalWidth / 2 + c * this._cellSize + this._cellSize / 2;
        const baseY =
          -totalHeight / 2 + r * this._cellSize + this._cellSize / 2;
        const cellVal = this.cellValues[r][c];
        const cellCol = this.cellColorSignals[r][c];
        const yOffset = this.cellYOffsets[r][c];

        this.add(
          <Txt
            ref={this.cellRefs[r][c]}
            text={() => this.formatNumber(cellVal())}
            fill={() => cellCol()}
            fontFamily={fonts.equation}
            fontSize={this._fontSize}
            fontWeight={500}
            x={x}
            y={() => baseY + yOffset()}
            textAlign="center"
            shadowColor={() => cellCol()}
            shadowBlur={this._glowBlur}
          />,
        );
      }
    }
  }

  private formatNumber(value: number): string {
    // Display integers cleanly; show 2 decimal places for non-integers
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  /** Get the cell Txt node at a given row and column. */
  public cell(row: number, col: number): Txt {
    return this.cellRefs[row][col]();
  }

  /** Get the current value of a cell. */
  public getValue(row: number, col: number): number {
    return this.cellValues[row][col]();
  }

  /** Set the value of a cell (non-animated). */
  public setValue(row: number, col: number, value: number): void {
    this.cellValues[row][col](value);
  }

  /**
   * Highlight a specific cell by changing its color, then revert.
   */
  public *highlightCell(
    row: number,
    col: number,
    color: string = colors.highlight,
    duration = 0.6,
  ) {
    const sig = this.cellColorSignals[row][col];
    const original = sig();
    yield* sig(color, duration * 0.3, springSmooth);
    yield* waitFor(duration * 0.4);
    yield* sig(original, duration * 0.3, springSmooth);
  }

  /**
   * Highlight an entire row by changing all cell colors, then revert.
   */
  public *highlightRow(
    row: number,
    color: string = colors.highlight,
    duration = 0.6,
  ) {
    const sigs = this.cellColorSignals[row];
    const originals = sigs.map((s) => s());

    // Color in
    yield* all(
      ...sigs.map((s) => s(color, duration * 0.3, springSmooth)),
    );
    yield* waitFor(duration * 0.4);
    // Color out
    yield* all(
      ...sigs.map((s, i) => s(originals[i], duration * 0.3, springSmooth)),
    );
  }

  /**
   * Animate swapping two rows with spring physics.
   * Cells slide vertically past each other and land in swapped positions.
   * Also swaps the underlying value and color signals.
   */
  public *swapRows(row1: number, row2: number, duration = 0.8) {
    const dy = (row2 - row1) * this._cellSize;

    // Animate row1 down and row2 up simultaneously
    yield* all(
      ...this.cellYOffsets[row1].map((s) => s(dy, duration, springBouncy)),
      ...this.cellYOffsets[row2].map((s) => s(-dy, duration, springBouncy)),
    );

    // Swap internal signal arrays
    const tempValues = this.cellValues[row1];
    this.cellValues[row1] = this.cellValues[row2];
    this.cellValues[row2] = tempValues;

    const tempColors = this.cellColorSignals[row1];
    this.cellColorSignals[row1] = this.cellColorSignals[row2];
    this.cellColorSignals[row2] = tempColors;

    const tempRefs = this.cellRefs[row1];
    this.cellRefs[row1] = this.cellRefs[row2];
    this.cellRefs[row2] = tempRefs;

    const tempOffsets = this.cellYOffsets[row1];
    this.cellYOffsets[row1] = this.cellYOffsets[row2];
    this.cellYOffsets[row2] = tempOffsets;

    // Reset offsets (they have been swapped, so both go to 0)
    for (let c = 0; c < this.cols; c++) {
      this.cellYOffsets[row1][c](0);
      this.cellYOffsets[row2][c](0);
    }
  }

  /**
   * Multiply all values in a row by a scalar, with animation.
   * Highlights the row, animates each cell value to its new amount.
   */
  public *scaleRow(
    row: number,
    scalar: number,
    duration = 0.6,
  ) {
    const sigs = this.cellColorSignals[row];
    const originals = sigs.map((s) => s());

    // Flash highlight
    yield* all(
      ...sigs.map((s) => s(colors.variable, duration * 0.2, springSmooth)),
    );

    // Animate values
    yield* all(
      ...this.cellValues[row].map((sig) => {
        const target = sig() * scalar;
        return sig(target, duration * 0.6, springSmooth);
      }),
    );

    // Restore colors
    yield* all(
      ...sigs.map((s, i) => s(originals[i], duration * 0.2, springSmooth)),
    );
  }

  /**
   * Staggered fade-in entrance: cells appear one by one
   * from top-left to bottom-right with slight delay.
   */
  public *fadeIn(duration = 1.0) {
    const totalCells = this.rows * this.cols;
    const stagger = totalCells > 0 ? (duration * 0.6) / totalCells : 0;
    const cellDuration = duration * 0.4;

    // Set all cells and brackets to invisible
    this.leftBracketRef().opacity(0);
    this.rightBracketRef().opacity(0);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.cellRefs[r][c]().opacity(0);
      }
    }

    // Fade in brackets
    yield* all(
      this.leftBracketRef().opacity(1, cellDuration, springSmooth),
      this.rightBracketRef().opacity(1, cellDuration, springSmooth),
    );

    // Stagger cells
    const animations: ThreadGenerator[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const delay = (r * this.cols + c) * stagger;
        const ref = this.cellRefs[r][c];
        animations.push(
          chain(
            waitFor(delay),
            ref().opacity(1, cellDuration, springSmooth),
          ),
        );
      }
    }
    yield* all(...animations);
  }
}
