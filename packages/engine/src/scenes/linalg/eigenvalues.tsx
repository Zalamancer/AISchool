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
import type {Mat2, Vec2} from '../../lib/math/linalg';
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
 * "What Eigenvalues Really Mean"
 *
 * 90-second cinematic scene that builds intuition for eigenvalues
 * by contrasting three matrices:
 *   M1 = diagonal       — eigenvectors along axes
 *   M2 = upper triangular — eigenvectors not axis-aligned
 *   M3 = rotation        — no real eigenvalues
 */
export default makeScene2D(function* (view) {
  // ═══════════════════════════════════════════════════════════
  // Constants
  // ═══════════════════════════════════════════════════════════
  const SCALE = 120;
  const CIRCLE_PTS = 80;
  const RANGE = 5;

  const M1: Mat2 = [2, 0, 0, 3];
  const M2: Mat2 = [1, 1, 0, 2];
  const M3: Mat2 = [0, -1, 1, 0]; // 90-degree rotation

  // Eigenvalues / eigenvectors for M1 and M2
  const eigs1 = eigenvalues(M1)!;       // [3, 2] or [2, 3]
  const eigVecs1 = eigenvectors(M1)!;
  const eigs2 = eigenvalues(M2)!;       // [2, 1]
  const eigVecs2 = eigenvectors(M2)!;
  // M3 has no real eigenvalues (rotation matrix)

  // Pre-compute unit circle in math space
  const circleMath: Vec2[] = [];
  for (let i = 0; i < CIRCLE_PTS; i++) {
    const a = (2 * Math.PI * i) / CIRCLE_PTS;
    circleMath.push([Math.cos(a), Math.sin(a)]);
  }

  // Eigenvector tips scaled by eigenvalue
  const eigTip1a = scaleVec2(eigVecs1[0], eigs1[0]);
  const eigTip1b = scaleVec2(eigVecs1[1], eigs1[1]);
  const eigTip2a = scaleVec2(eigVecs2[0], eigs2[0]);
  const eigTip2b = scaleVec2(eigVecs2[1], eigs2[1]);

  // Transform signals — one per matrix demonstration
  const t1 = createSignal(0);
  const t2 = createSignal(0);
  const t3 = createSignal(0);

  // ═══════════════════════════════════════════════════════════
  // Background
  // ═══════════════════════════════════════════════════════════
  view.add(<Rect width={1920} height={1080} fill={colors.bgBase} />);
  view.add(<Rect width={1920} height={1080} fill={colors.bgEdge} opacity={0.25} />);

  // ═══════════════════════════════════════════════════════════
  // Camera — wraps all geometry (center-left)
  // ═══════════════════════════════════════════════════════════
  const camera = createRef<Camera>();

  // M1 refs
  const grid1 = createRef<CoordinateGrid>();
  const circle1 = createRef<Line>();
  const eigenArrow1a = createRef<VectorArrow>();
  const eigenArrow1b = createRef<VectorArrow>();
  const eigenLabel1a = createRef<Txt>();
  const eigenLabel1b = createRef<Txt>();

  // M2 refs
  const grid2 = createRef<CoordinateGrid>();
  const circle2 = createRef<Line>();
  const eigenArrow2a = createRef<VectorArrow>();
  const eigenArrow2b = createRef<VectorArrow>();
  const eigenLabel2a = createRef<Txt>();
  const eigenLabel2b = createRef<Txt>();

  // M3 refs
  const grid3 = createRef<CoordinateGrid>();
  const circle3 = createRef<Line>();

  // Narration labels
  const narrativeLabel = createRef<Txt>();

  // Helper: build circle points with interpolation
  function circlePoints(mat: Mat2, tVal: number): [number, number][] {
    return circleMath.map(([x, y]): [number, number] => {
      const tr = mulMV(mat, [x, y]);
      return [
        (x + (tr[0] - x) * tVal) * SCALE,
        -(y + (tr[1] - y) * tVal) * SCALE,
      ];
    });
  }

  view.add(
    <Camera ref={camera} x={-150} y={0}>
      {/* ═════ M1: Diagonal ═════ */}
      <CoordinateGrid
        ref={grid1}
        gridScale={SCALE}
        gridRange={RANGE}
        matrix={M1}
        transformT={() => t1()}
        opacity={0}
      />
      <Line
        ref={circle1}
        closed
        stroke={colors.geoPrimary}
        lineWidth={4}
        end={0}
        shadowColor={colors.geoPrimary}
        shadowBlur={12}
        points={() => circlePoints(M1, t1())}
      />
      <VectorArrow
        ref={eigenArrow1a}
        from={[0, 0]}
        to={eigTip1a}
        arrowScale={SCALE}
        arrowColor={colors.eigen1}
        drawProgress={0}
        glowBlur={14}
      />
      <VectorArrow
        ref={eigenArrow1b}
        from={[0, 0]}
        to={eigTip1b}
        arrowScale={SCALE}
        arrowColor={colors.eigen2}
        drawProgress={0}
        glowBlur={14}
      />
      <Txt
        ref={eigenLabel1a}
        text={`\u03BB\u2081 = ${eigs1[0]}`}
        fill={colors.eigen1}
        fontFamily={fonts.label}
        fontSize={22}
        opacity={0}
        x={eigTip1a[0] * SCALE + 30}
        y={-eigTip1a[1] * SCALE - 20}
      />
      <Txt
        ref={eigenLabel1b}
        text={`\u03BB\u2082 = ${eigs1[1]}`}
        fill={colors.eigen2}
        fontFamily={fonts.label}
        fontSize={22}
        opacity={0}
        x={eigTip1b[0] * SCALE + 30}
        y={-eigTip1b[1] * SCALE - 20}
      />

      {/* ═════ M2: Upper triangular ═════ */}
      <CoordinateGrid
        ref={grid2}
        gridScale={SCALE}
        gridRange={RANGE}
        matrix={M2}
        transformT={() => t2()}
        opacity={0}
      />
      <Line
        ref={circle2}
        closed
        stroke={colors.geoPrimary}
        lineWidth={4}
        end={0}
        opacity={0}
        shadowColor={colors.geoPrimary}
        shadowBlur={12}
        points={() => circlePoints(M2, t2())}
      />
      <VectorArrow
        ref={eigenArrow2a}
        from={[0, 0]}
        to={eigTip2a}
        arrowScale={SCALE}
        arrowColor={colors.eigen1}
        drawProgress={0}
        opacity={0}
        glowBlur={14}
      />
      <VectorArrow
        ref={eigenArrow2b}
        from={[0, 0]}
        to={eigTip2b}
        arrowScale={SCALE}
        arrowColor={colors.eigen2}
        drawProgress={0}
        opacity={0}
        glowBlur={14}
      />
      <Txt
        ref={eigenLabel2a}
        text={`\u03BB\u2081 = ${eigs2[0]}`}
        fill={colors.eigen1}
        fontFamily={fonts.label}
        fontSize={22}
        opacity={0}
        x={eigTip2a[0] * SCALE + 30}
        y={-eigTip2a[1] * SCALE - 20}
      />
      <Txt
        ref={eigenLabel2b}
        text={`\u03BB\u2082 = ${eigs2[1]}`}
        fill={colors.eigen2}
        fontFamily={fonts.label}
        fontSize={22}
        opacity={0}
        x={eigTip2b[0] * SCALE + 30}
        y={-eigTip2b[1] * SCALE - 20}
      />

      {/* ═════ M3: Rotation ═════ */}
      <CoordinateGrid
        ref={grid3}
        gridScale={SCALE}
        gridRange={RANGE}
        matrix={M3}
        transformT={() => t3()}
        opacity={0}
      />
      <Line
        ref={circle3}
        closed
        stroke={colors.geoPrimary}
        lineWidth={4}
        end={0}
        opacity={0}
        shadowColor={colors.geoPrimary}
        shadowBlur={12}
        points={() => circlePoints(M3, t3())}
      />
    </Camera>,
  );

  // ═══════════════════════════════════════════════════════════
  // Equations — upper-right third (fixed on screen)
  // ═══════════════════════════════════════════════════════════
  const titleEq = createRef<MathEquation>();
  const matrixEq = createRef<MathEquation>();
  const eigenEq = createRef<MathEquation>();
  const detEq = createRef<MathEquation>();

  // Narrative text at bottom
  view.add(
    <Txt
      ref={narrativeLabel}
      text=""
      fill={colors.text}
      fontFamily={fonts.body}
      fontSize={26}
      opacity={0}
      x={0}
      y={450}
    />,
  );

  // M1 matrix display
  const m1Tex = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: ' = ', color: colors.operator},
    {
      tex: `\\begin{bmatrix} {\\color{${colors.constant}}2} & {\\color{${colors.constant}}0} \\\\ {\\color{${colors.constant}}0} & {\\color{${colors.constant}}3} \\end{bmatrix}`,
      color: colors.text,
    },
  ]);

  view.add(
    <>
      <MathEquation
        ref={titleEq}
        tex={'\\phantom{x}'}
        baseFill={colors.text}
        texWidth={360}
        x={640}
        y={-360}
        opacity={0}
      />
      <MathEquation
        ref={matrixEq}
        tex={'\\phantom{x}'}
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
      <MathEquation
        ref={detEq}
        tex={'\\phantom{x}'}
        baseFill={colors.text}
        texWidth={420}
        x={0}
        y={0}
        opacity={0}
      />
    </>,
  );

  // ═══════════════════════════════════════════════════════════
  // BEAT 1 (0–5s): Dark bg + grid fade in
  // ═══════════════════════════════════════════════════════════
  yield* grid1().opacity(1, 2, easeInOutCubic);
  yield* waitFor(1);
  yield* circle1().end(1, 1.5, easeInOutCubic);
  yield* waitFor(0.5);

  // ═══════════════════════════════════════════════════════════
  // BEAT 2 (5–15s): M1 diagonal — eigenvectors along axes
  // ═══════════════════════════════════════════════════════════
  // Show M1 matrix
  matrixEq().setTex(m1Tex);
  yield* matrixEq().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(0.5);

  // Draw eigenvectors (axis-aligned for diagonal matrix)
  yield* eigenArrow1a().drawIn(1.2);
  yield* waitFor(0.3);
  yield* eigenLabel1a().opacity(1, 0.5);
  yield* waitFor(0.3);

  yield* eigenArrow1b().drawIn(1.2);
  yield* waitFor(0.3);
  yield* eigenLabel1b().opacity(1, 0.5);
  yield* waitFor(0.5);

  // Eigenvalue equation
  const avLambdaV = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: '\\,', color: colors.operator},
    {tex: '\\mathbf{v}', color: colors.variable},
    {tex: ' = ', color: colors.operator},
    {tex: '\\lambda', color: colors.constant},
    {tex: '\\,', color: colors.operator},
    {tex: '\\mathbf{v}', color: colors.variable},
  ]);
  titleEq().setTex(avLambdaV);
  yield* titleEq().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(0.5);

  // Transform: circle -> ellipse aligned with axes
  yield* t1(1, 3, springBouncy);
  yield* waitFor(0.5);

  // Narrative
  narrativeLabel().text('When the matrix is diagonal, eigenvectors are obvious.');
  yield* narrativeLabel().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(2);
  yield* narrativeLabel().opacity(0, 0.6);
  yield* waitFor(0.5);

  // ═══════════════════════════════════════════════════════════
  // BEAT 3 (15–30s): Transition to M2 — upper triangular
  // ═══════════════════════════════════════════════════════════
  // Fade out M1 geometry
  yield* all(
    grid1().opacity(0, 1),
    circle1().opacity(0, 1),
    eigenArrow1a().opacity(0, 1),
    eigenArrow1b().opacity(0, 1),
    eigenLabel1a().opacity(0, 1),
    eigenLabel1b().opacity(0, 1),
  );
  yield* waitFor(0.3);

  // Show M2 grid and circle
  yield* all(
    grid2().opacity(1, 1.5, easeInOutCubic),
    circle2().opacity(1, 1),
  );
  circle2().end(0);
  yield* circle2().end(1, 1.2, easeInOutCubic);
  yield* waitFor(0.3);

  // Update matrix equation to M2
  const m2Tex = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: ' = ', color: colors.operator},
    {
      tex: `\\begin{bmatrix} {\\color{${colors.constant}}1} & {\\color{${colors.constant}}1} \\\\ {\\color{${colors.constant}}0} & {\\color{${colors.constant}}2} \\end{bmatrix}`,
      color: colors.text,
    },
  ]);
  yield* matrixEq().morphTo(m2Tex, 1.0);
  yield* waitFor(0.5);

  // Show eigenvectors for M2
  eigenArrow2a().opacity(1);
  eigenArrow2b().opacity(1);
  yield* eigenArrow2a().drawIn(1.2);
  yield* waitFor(0.3);
  yield* eigenLabel2a().opacity(1, 0.5);
  yield* waitFor(0.3);

  yield* eigenArrow2b().drawIn(1.2);
  yield* waitFor(0.3);
  yield* eigenLabel2b().opacity(1, 0.5);
  yield* waitFor(0.5);

  // Show eigenvalue equation for M2
  const eigenTex2a = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: '\\mathbf{v}', color: colors.eigen1},
    {tex: ' = ', color: colors.operator},
    {tex: `${eigs2[0]}`, color: colors.constant},
    {tex: '\\,', color: colors.operator},
    {tex: '\\mathbf{v}', color: colors.eigen1},
  ]);
  eigenEq().setTex(eigenTex2a);
  yield* eigenEq().opacity(1, 0.8);
  yield* waitFor(0.5);

  // Transform M2 — eigenvectors stay on their lines
  yield* t2(1, 3, springBouncy);
  yield* waitFor(1);

  // Narrative: eigenvectors stay on their lines
  narrativeLabel().text('Eigenvectors stay on their own line during transformation.');
  yield* narrativeLabel().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(2.5);
  yield* narrativeLabel().opacity(0, 0.6);
  yield* waitFor(0.5);

  // ═══════════════════════════════════════════════════════════
  // BEAT 4 (30–50s): M3 rotation — no real eigenvalues
  // ═══════════════════════════════════════════════════════════
  // Fade out M2 geometry
  yield* all(
    grid2().opacity(0, 1),
    circle2().opacity(0, 1),
    eigenArrow2a().opacity(0, 1),
    eigenArrow2b().opacity(0, 1),
    eigenLabel2a().opacity(0, 1),
    eigenLabel2b().opacity(0, 1),
    eigenEq().opacity(0, 0.8),
  );
  yield* waitFor(0.3);

  // Show M3 grid and circle
  yield* all(
    grid3().opacity(1, 1.5, easeInOutCubic),
    circle3().opacity(1, 1),
  );
  circle3().end(0);
  yield* circle3().end(1, 1.2, easeInOutCubic);
  yield* waitFor(0.3);

  // Update matrix equation to M3
  const m3Tex = MathEquation.colorize([
    {tex: 'A', color: colors.variable},
    {tex: ' = ', color: colors.operator},
    {
      tex: `\\begin{bmatrix} {\\color{${colors.constant}}0} & {\\color{${colors.constant}}-1} \\\\ {\\color{${colors.constant}}1} & {\\color{${colors.constant}}0} \\end{bmatrix}`,
      color: colors.text,
    },
  ]);
  yield* matrixEq().morphTo(m3Tex, 1.0);
  yield* waitFor(0.5);

  // Transform M3 — circle rotates but stays a circle
  yield* t3(1, 4, springSmooth);
  yield* waitFor(1);

  // Show "no real eigenvalues" narrative
  narrativeLabel().text('Every vector changes direction \u2014 no real eigenvalues!');
  yield* narrativeLabel().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(2);
  yield* narrativeLabel().opacity(0, 0.6);
  yield* waitFor(0.5);

  // Show complex eigenvalues
  const complexEigenTex = MathEquation.colorize([
    {tex: '\\lambda', color: colors.constant},
    {tex: ' = ', color: colors.operator},
    {tex: '\\pm\\,', color: colors.operator},
    {tex: 'i', color: colors.eigen1},
  ]);
  eigenEq().setTex(complexEigenTex);
  yield* eigenEq().opacity(1, 0.8);
  yield* waitFor(1);

  // Emphasize: complex eigenvalues
  yield* eigenEq().emphasize(0.5);
  yield* waitFor(1.5);
  yield* eigenEq().deemphasize(0.4);
  yield* waitFor(1);

  // Narrative
  narrativeLabel().text('Complex eigenvalues mean pure rotation.');
  yield* narrativeLabel().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(2.5);
  yield* narrativeLabel().opacity(0, 0.6);
  yield* waitFor(0.5);

  // ═══════════════════════════════════════════════════════════
  // BEAT 5 (50–70s): Side-by-side comparison (zoom out)
  // ═══════════════════════════════════════════════════════════
  // Fade out M3 solo view
  yield* all(
    grid3().opacity(0, 0.8),
    circle3().opacity(0, 0.8),
    eigenEq().opacity(0, 0.6),
    matrixEq().opacity(0, 0.6),
    titleEq().opacity(0, 0.6),
  );
  yield* waitFor(0.3);

  // Reposition all three side by side inside the camera
  // M1 at left, M2 at center, M3 at right
  const SIDE_SPACING = 500;

  // Reset transforms for replay
  t1(0);
  t2(0);
  t3(0);

  // Shift geometry groups via position offsets on grids & circles
  grid1().position([-SIDE_SPACING, 0]);
  circle1().position([-SIDE_SPACING, 0]);
  eigenArrow1a().position([-SIDE_SPACING, 0]);
  eigenArrow1b().position([-SIDE_SPACING, 0]);
  eigenLabel1a().position([
    -SIDE_SPACING + eigTip1a[0] * SCALE + 30,
    -eigTip1a[1] * SCALE - 20,
  ]);
  eigenLabel1b().position([
    -SIDE_SPACING + eigTip1b[0] * SCALE + 30,
    -eigTip1b[1] * SCALE - 20,
  ]);

  grid2().position([0, 0]);
  circle2().position([0, 0]);
  eigenArrow2a().position([0, 0]);
  eigenArrow2b().position([0, 0]);
  eigenLabel2a().position([
    eigTip2a[0] * SCALE + 30,
    -eigTip2a[1] * SCALE - 20,
  ]);
  eigenLabel2b().position([
    eigTip2b[0] * SCALE + 30,
    -eigTip2b[1] * SCALE - 20,
  ]);

  grid3().position([SIDE_SPACING, 0]);
  circle3().position([SIDE_SPACING, 0]);

  // Zoom out camera to fit all three
  yield* all(
    camera().zoom(0.55, 2, springSmooth),
    camera().position([0, 0], 2, springSmooth),
  );
  yield* waitFor(0.3);

  // Fade in all three
  circle1().end(1);
  circle2().end(1);
  circle3().end(1);
  yield* all(
    grid1().opacity(1, 1),
    circle1().opacity(1, 1),
    eigenArrow1a().opacity(1, 1),
    eigenArrow1b().opacity(1, 1),
    eigenLabel1a().opacity(1, 1),
    eigenLabel1b().opacity(1, 1),
    grid2().opacity(1, 1),
    circle2().opacity(1, 1),
    eigenArrow2a().opacity(1, 1),
    eigenArrow2b().opacity(1, 1),
    eigenLabel2a().opacity(1, 1),
    eigenLabel2b().opacity(1, 1),
    grid3().opacity(1, 1),
    circle3().opacity(1, 1),
  );
  yield* waitFor(0.5);

  // Animate all three transforms simultaneously
  yield* all(
    t1(1, 3, springBouncy),
    t2(1, 3, springBouncy),
    t3(1, 3, springSmooth),
  );
  yield* waitFor(1);

  // Column labels for comparison
  const colLabel1 = createRef<Txt>();
  const colLabel2 = createRef<Txt>();
  const colLabel3 = createRef<Txt>();

  // These are inside the Camera, so must adjust for camera zoom
  view.add(
    <>
      <Txt
        ref={colLabel1}
        text="Diagonal"
        fill={colors.text}
        fontFamily={fonts.label}
        fontSize={24}
        opacity={0}
        x={-SIDE_SPACING * 0.55 - 150}
        y={-380}
      />
      <Txt
        ref={colLabel2}
        text="Triangular"
        fill={colors.text}
        fontFamily={fonts.label}
        fontSize={24}
        opacity={0}
        x={-150}
        y={-380}
      />
      <Txt
        ref={colLabel3}
        text="Rotation"
        fill={colors.text}
        fontFamily={fonts.label}
        fontSize={24}
        opacity={0}
        x={SIDE_SPACING * 0.55 - 150}
        y={-380}
      />
    </>,
  );

  yield* all(
    colLabel1().opacity(1, 0.6),
    colLabel2().opacity(1, 0.6),
    colLabel3().opacity(1, 0.6),
  );
  yield* waitFor(1);

  // Insight narrative
  narrativeLabel().text(
    'Eigenvalues tell you "how much." Eigenvectors tell you "which direction."',
  );
  yield* narrativeLabel().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(4);
  yield* narrativeLabel().opacity(0, 0.6);
  yield* waitFor(1);

  // Fade out comparison columns
  yield* all(
    colLabel1().opacity(0, 0.6),
    colLabel2().opacity(0, 0.6),
    colLabel3().opacity(0, 0.6),
  );

  // ═══════════════════════════════════════════════════════════
  // BEAT 6 (70–90s): Final equation det(A - λI) = 0
  // ═══════════════════════════════════════════════════════════
  // Fade out all geometry
  yield* all(
    grid1().opacity(0, 1.5),
    circle1().opacity(0, 1.5),
    eigenArrow1a().opacity(0, 1.5),
    eigenArrow1b().opacity(0, 1.5),
    eigenLabel1a().opacity(0, 1.5),
    eigenLabel1b().opacity(0, 1.5),
    grid2().opacity(0, 1.5),
    circle2().opacity(0, 1.5),
    eigenArrow2a().opacity(0, 1.5),
    eigenArrow2b().opacity(0, 1.5),
    eigenLabel2a().opacity(0, 1.5),
    eigenLabel2b().opacity(0, 1.5),
    grid3().opacity(0, 1.5),
    circle3().opacity(0, 1.5),
  );
  yield* waitFor(0.5);

  // Reset camera for final equation
  yield* all(
    camera().zoom(1, 1.5, springSmooth),
    camera().position([0, 0], 1.5, springSmooth),
  );
  yield* waitFor(0.5);

  // Characteristic equation — center screen
  const charEqTex = MathEquation.colorize([
    {tex: '\\det', color: colors.function},
    {tex: '\\bigl(', color: colors.operator},
    {tex: 'A', color: colors.variable},
    {tex: ' - ', color: colors.operator},
    {tex: '\\lambda', color: colors.constant},
    {tex: '\\,', color: colors.operator},
    {tex: 'I', color: colors.variable},
    {tex: '\\bigr)', color: colors.operator},
    {tex: ' = ', color: colors.operator},
    {tex: '0', color: colors.constant},
  ]);
  detEq().setTex(charEqTex);
  detEq().position([0, 0]);

  yield* detEq().opacity(1, 1.2, easeOutCubic);
  yield* waitFor(1.5);

  // Emphasis — the defining equation
  yield* detEq().emphasize(0.6);
  yield* waitFor(2);
  yield* detEq().deemphasize(0.5);
  yield* waitFor(1);

  // Subtitle narrative
  narrativeLabel().text(
    'The characteristic equation: where eigenvalues come from.',
  );
  yield* narrativeLabel().opacity(1, 0.8, easeOutCubic);
  yield* waitFor(3);

  // Final fade out
  yield* all(
    detEq().opacity(0, 2),
    narrativeLabel().opacity(0, 2),
  );
  yield* waitFor(2);
});
