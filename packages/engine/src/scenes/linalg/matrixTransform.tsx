import {
  Camera,
  Line,
  makeScene2D,
  Rect,
  Txt,
} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  waitFor,
} from '@motion-canvas/core';

import {colors, fonts} from '../../lib/theme';
import {springBouncy, springSmooth} from '../../lib/motion/spring';
import type {Mat2} from '../../lib/math/linalg';
import {
  eigenvalues,
  eigenvectors,
  mulMV,
  scaleVec2,
} from '../../lib/math/linalg';
import {CoordinateGrid} from '../../lib/components/CoordinateGrid';
import {MathEquation} from '../../lib/components/MathEquation';
import {VectorArrow} from '../../lib/components/VectorArrow';

/**
 * "What Matrices Do to Space"
 *
 * 90-second cinematic scene: grid deformation, circle → ellipse,
 * eigenvectors, eigenvalues. Four aesthetic pillars:
 * dimensional depth, typographic performance, motion with weight,
 * cinematic composition.
 */
export default makeScene2D(function* (view) {
  // ═══════════════════════════════════════════════════════════
  // Constants & computed data
  // ═══════════════════════════════════════════════════════════
  const SCALE = 120;
  const MATRIX: Mat2 = [2, 1, 0.5, 1.5];
  const CIRCLE_PTS = 80;
  const RANGE = 5;

  const eigs = eigenvalues(MATRIX)!;       // [~2.46, ~1.04]
  const eigVecs = eigenvectors(MATRIX)!;   // normalized directions

  // Shared transform signal drives grid + circle simultaneously
  const transformT = createSignal(0);

  // ═══════════════════════════════════════════════════════════
  // Background
  // ═══════════════════════════════════════════════════════════
  view.add(<Rect width={1920} height={1080} fill={colors.bgBase} />);
  view.add(<Rect width={1920} height={1080} fill={colors.bgEdge} opacity={0.25} />);

  // ═══════════════════════════════════════════════════════════
  // Camera (wraps geometry — equations live outside)
  // ═══════════════════════════════════════════════════════════
  const camera = createRef<Camera>();
  const grid = createRef<CoordinateGrid>();
  const unitCircle = createRef<Line>();
  const eigenArrow1 = createRef<VectorArrow>();
  const eigenArrow2 = createRef<VectorArrow>();
  const eigenLabel1 = createRef<Txt>();
  const eigenLabel2 = createRef<Txt>();

  // Pre-compute circle points in math space
  const circleMath: [number, number][] = [];
  for (let i = 0; i < CIRCLE_PTS; i++) {
    const a = (2 * Math.PI * i) / CIRCLE_PTS;
    circleMath.push([Math.cos(a), Math.sin(a)]);
  }

  // Eigenvector tip positions (scaled by eigenvalue)
  const eigTip1 = scaleVec2(eigVecs[0], eigs[0]);
  const eigTip2 = scaleVec2(eigVecs[1], eigs[1]);

  view.add(
    <Camera ref={camera}>
      {/* Grid — background plane */}
      <CoordinateGrid
        ref={grid}
        gridScale={SCALE}
        gridRange={RANGE}
        matrix={MATRIX}
        transformT={() => transformT()}
        opacity={0}
      />

      {/* Unit circle — deforms reactively with transformT */}
      <Line
        ref={unitCircle}
        closed
        stroke={colors.geoPrimary}
        lineWidth={4}
        end={0}
        shadowColor={colors.geoPrimary}
        shadowBlur={12}
        points={() => {
          const t = transformT();
          return circleMath.map(([x, y]): [number, number] => {
            const tr = mulMV(MATRIX, [x, y]);
            return [
              (x + (tr[0] - x) * t) * SCALE,
              -(y + (tr[1] - y) * t) * SCALE,
            ];
          });
        }}
      />

      {/* Eigenvector arrows */}
      <VectorArrow
        ref={eigenArrow1}
        from={[0, 0]}
        to={eigTip1}
        arrowScale={SCALE}
        arrowColor={colors.eigen1}
        drawProgress={0}
        glowBlur={14}
      />
      <VectorArrow
        ref={eigenArrow2}
        from={[0, 0]}
        to={eigTip2}
        arrowScale={SCALE}
        arrowColor={colors.eigen2}
        drawProgress={0}
        glowBlur={14}
      />

      {/* Eigenvector labels */}
      <Txt
        ref={eigenLabel1}
        text={`λ₁ ≈ ${eigs[0].toFixed(2)}`}
        fill={colors.eigen1}
        fontFamily={fonts.label}
        fontSize={22}
        opacity={0}
        x={eigTip1[0] * SCALE + 30}
        y={-eigTip1[1] * SCALE - 30}
      />
      <Txt
        ref={eigenLabel2}
        text={`λ₂ ≈ ${eigs[1].toFixed(2)}`}
        fill={colors.eigen2}
        fontFamily={fonts.label}
        fontSize={22}
        opacity={0}
        x={eigTip2[0] * SCALE + 30}
        y={-eigTip2[1] * SCALE - 30}
      />
    </Camera>,
  );

  // ═══════════════════════════════════════════════════════════
  // Equations — foreground, fixed on screen (rule of thirds)
  // Right third (~x:620), upper area (~y:-350)
  // ═══════════════════════════════════════════════════════════
  const titleEq = createRef<MathEquation>();
  const matrixEq = createRef<MathEquation>();
  const eigenEq = createRef<MathEquation>();

  const titleTex = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: '\\,', color: colors.operator},
    {tex: '\\mathbf{v}', color: colors.variable},
    {tex: ' = ', color: colors.operator},
    {tex: '\\lambda', color: colors.constant},
    {tex: '\\,', color: colors.operator},
    {tex: '\\mathbf{v}', color: colors.variable},
  ]);

  const matrixTex = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: ' = ', color: colors.operator},
    {
      tex: `\\begin{bmatrix} {\\color{${colors.constant}}2} & {\\color{${colors.constant}}1} \\\\ {\\color{${colors.constant}}0.5} & {\\color{${colors.constant}}1.5} \\end{bmatrix}`,
      color: colors.text,
    },
  ]);

  view.add(
    <>
      <MathEquation
        ref={titleEq}
        tex={titleTex}
        baseFill={colors.text}
        texWidth={360}
        x={640}
        y={-360}
        opacity={0}
      />
      <MathEquation
        ref={matrixEq}
        tex={matrixTex}
        baseFill={colors.text}
        texWidth={280}
        x={640}
        y={-260}
        opacity={0}
      />
      <MathEquation
        ref={eigenEq}
        tex={'\\phantom{x}'}
        baseFill={colors.text}
        texWidth={400}
        x={640}
        y={-160}
        opacity={0}
      />
    </>,
  );

  // ═══════════════════════════════════════════════════════════
  // BEAT 1 (0–3s): Grid appears
  // ═══════════════════════════════════════════════════════════
  yield* grid().opacity(1, 2, easeInOutCubic);
  yield* waitFor(1);

  // ═══════════════════════════════════════════════════════════
  // BEAT 2 (3–8s): Unit circle draws itself
  // ═══════════════════════════════════════════════════════════
  yield* unitCircle().end(1, 1.8, easeInOutCubic);
  yield* waitFor(1);
  yield* camera().zoom(1.05, 2, springSmooth);
  yield* waitFor(0.5);

  // ═══════════════════════════════════════════════════════════
  // BEAT 3 (8–18s): Equations arrive
  // ═══════════════════════════════════════════════════════════
  yield* titleEq().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(1.5);

  yield* matrixEq().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(1.5);

  // Emphasize A
  yield* titleEq().emphasize(0.5);
  yield* waitFor(1.2);
  yield* titleEq().deemphasize(0.4);
  yield* waitFor(2);

  // ═══════════════════════════════════════════════════════════
  // BEAT 4 (18–38s): THE TRANSFORMATION
  // ═══════════════════════════════════════════════════════════
  yield* camera().position([-50, 0], 1, springSmooth);
  yield* waitFor(0.5);

  // Transform — spring overshoot gives bounce
  yield* transformT(1, 4, springBouncy);
  yield* waitFor(3);

  // Emphasize matrix
  yield* matrixEq().emphasize(0.4);
  yield* waitFor(2);
  yield* matrixEq().deemphasize(0.4);
  yield* waitFor(4);

  // ═══════════════════════════════════════════════════════════
  // BEAT 5 (38–60s): Eigenvectors emerge
  // ═══════════════════════════════════════════════════════════
  yield* camera().zoom(1.15, 1.5, springSmooth);
  yield* waitFor(0.5);

  // Eigenvector 1 — hot pink
  yield* eigenArrow1().drawIn(1.5);
  yield* waitFor(0.5);
  yield* eigenLabel1().opacity(1, 0.6);
  yield* waitFor(1);

  // Eigenvector 2 — mint
  yield* eigenArrow2().drawIn(1.5);
  yield* waitFor(0.5);
  yield* eigenLabel2().opacity(1, 0.6);
  yield* waitFor(1);

  // Pull back
  yield* camera().zoom(1.05, 1.5, springSmooth);
  yield* waitFor(1);

  // Eigenvalue equation
  const eigenTex1 = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: '\\mathbf{v}_1', color: colors.eigen1},
    {tex: ' = ', color: colors.operator},
    {tex: eigs[0].toFixed(2), color: colors.constant},
    {tex: '\\,', color: colors.operator},
    {tex: '\\mathbf{v}_1', color: colors.eigen1},
  ]);
  eigenEq().setTex(eigenTex1);
  yield* eigenEq().opacity(1, 0.8);
  yield* waitFor(3);

  // Morph to second eigenvalue
  const eigenTex2 = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: '\\mathbf{v}_2', color: colors.eigen2},
    {tex: ' = ', color: colors.operator},
    {tex: eigs[1].toFixed(2), color: colors.constant},
    {tex: '\\,', color: colors.operator},
    {tex: '\\mathbf{v}_2', color: colors.eigen2},
  ]);
  yield* eigenEq().morphTo(eigenTex2, 1.2);
  yield* waitFor(3);

  // ═══════════════════════════════════════════════════════════
  // BEAT 6 (60–80s): Demonstrate eigenvectors only scale
  // ═══════════════════════════════════════════════════════════

  // Reset transform to replay
  yield* transformT(0, 2, springSmooth);
  yield* waitFor(0.5);

  // Follow eigenvector 1
  yield* all(
    camera().position(
      [eigTip1[0] * SCALE * 0.3, -eigTip1[1] * SCALE * 0.3],
      2,
      springSmooth,
    ),
    camera().zoom(1.3, 2, springSmooth),
  );
  yield* waitFor(0.3);

  // Replay transform
  yield* transformT(1, 3, springBouncy);
  yield* waitFor(2);

  // Follow eigenvector 2
  yield* all(
    camera().position(
      [eigTip2[0] * SCALE * 0.3, -eigTip2[1] * SCALE * 0.3],
      2,
      springSmooth,
    ),
    camera().zoom(1.2, 2, springSmooth),
  );
  yield* waitFor(3);

  // Reset camera to full view
  yield* all(
    camera().position([0, 0], 2, springSmooth),
    camera().zoom(1, 2, springSmooth),
  );
  yield* waitFor(2);

  // ═══════════════════════════════════════════════════════════
  // BEAT 7 (80–90s): Resolve — glow, then fade
  // ═══════════════════════════════════════════════════════════
  yield* titleEq().emphasize(0.6);
  yield* waitFor(1.2);
  yield* titleEq().deemphasize(0.6);
  yield* waitFor(1);

  // Fade everything out
  yield* all(
    grid().opacity(0, 2),
    unitCircle().opacity(0, 2),
    eigenArrow1().opacity(0, 2),
    eigenArrow2().opacity(0, 2),
    eigenLabel1().opacity(0, 2),
    eigenLabel2().opacity(0, 2),
    titleEq().opacity(0, 2),
    matrixEq().opacity(0, 2),
    eigenEq().opacity(0, 2),
  );
  yield* waitFor(2);
});
