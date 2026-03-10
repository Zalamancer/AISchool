import {Latex, Node, NodeProps} from '@motion-canvas/2d';
import {all, createRef} from '@motion-canvas/core';
import {colors} from '../theme';

export interface TermDef {
  tex: string;
  color: string;
}

export interface MathEquationProps extends NodeProps {
  tex?: string;
  baseFill?: string;
  texWidth?: number;
  glowRadius?: number;
}

/**
 * Enhanced LaTeX equation with semantic coloring, emphasis, and glow.
 *
 * Usage:
 *   const eq = MathEquation.colorize([...]);
 *   <MathEquation tex={eq} texWidth={360} />
 */
export class MathEquation extends Node {
  private readonly latexRef = createRef<Latex>();
  private readonly _glowRadius: number;

  public constructor(props: MathEquationProps) {
    super(props);
    this._glowRadius = props.glowRadius ?? 0;

    this.add(
      <Latex
        ref={this.latexRef}
        tex={props.tex ?? ''}
        fill={props.baseFill ?? colors.text}
        width={props.texWidth ?? 300}
        shadowColor={props.baseFill ?? colors.text}
        shadowBlur={this._glowRadius}
      />,
    );
  }

  /** Get inner Latex node */
  public latex(): Latex {
    return this.latexRef();
  }

  /** Set tex string directly (non-animated) */
  public setTex(tex: string) {
    this.latexRef().tex(tex);
  }

  /**
   * Build TeX with per-term coloring and {{part}} markers.
   */
  public static colorize(terms: TermDef[]): string {
    return terms
      .map(({tex, color}) => `{{\\color{${color}}${tex}}}`)
      .join('');
  }

  /** Morph to new equation */
  public *morphTo(newTex: string, duration: number) {
    yield* this.latexRef().tex(newTex, duration);
  }

  /** Emphasis: scale up + glow */
  public *emphasize(duration = 0.4) {
    yield* all(
      this.scale(1.05, duration),
      this.latexRef().shadowBlur(15, duration),
    );
  }

  /** Reverse emphasis */
  public *deemphasize(duration = 0.4) {
    yield* all(
      this.scale(1.0, duration),
      this.latexRef().shadowBlur(0, duration),
    );
  }
}
