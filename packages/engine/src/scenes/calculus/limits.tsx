import {
  Camera,
  Circle,
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
import {MathEquation} from '../../lib/components/MathEquation';
import {VectorArrow} from '../../lib/components/VectorArrow';

/**
 * "What Does a Limit Really Mean?"
 *
 * 90-second cinematic scene: visualizes f(x) = (x^2 - 1)/(x - 1),
 * which simplifies to x + 1 everywhere except x = 1 (hole).
 * Builds intuition for limits by animating approach from both sides,
 * showing convergence to y = 2, and illustrating the epsilon-delta
 * definition.
 */
export default makeScene2D(function* (view) {
  // =============================================================
  // Constants
  // =============================================================
  const SCALE = 120; // pixels per unit
  const X_MIN = -2;
  const X_MAX = 4;
  const Y_MIN = -1;
  const Y_MAX = 5;

  // Pixel boundaries
  const pxLeft = X_MIN * SCALE;
  const pxRight = X_MAX * SCALE;
  const pxTop = -Y_MAX * SCALE; // y is flipped in screen space
  const pxBottom = -Y_MIN * SCALE;

  // The function f(x) = (x^2 - 1)/(x - 1) = x + 1, with hole at x=1
  const f = (x: number) => x + 1;

  // =============================================================
  // Background
  // =============================================================
  view.add(<Rect width={1920} height={1080} fill={colors.bgBase} />);
  view.add(
    <Rect width={1920} height={1080} fill={colors.bgEdge} opacity={0.25} />,
  );

  // =============================================================
  // Camera
  // =============================================================
  const camera = createRef<Camera>();

  // Refs for axes
  const xAxis = createRef<Line>();
  const yAxis = createRef<Line>();
  const xLabel = createRef<Txt>();
  const yLabel = createRef<Txt>();

  // Refs for curve and hole
  const curveLeft = createRef<Line>();
  const curveRight = createRef<Line>();
  const hole = createRef<Circle>();

  // Refs for approach animation
  const approachPoint = createRef<Circle>();
  const dashedVertical = createRef<Line>();
  const xValueLabel = createRef<Txt>();
  const yValueLabel = createRef<Txt>();

  // Refs for horizontal limit line
  const limitLine = createRef<Line>();

  // Refs for epsilon-delta bands
  const epsilonBand = createRef<Rect>();
  const deltaBand = createRef<Rect>();

  // Signals
  const approachX = createSignal(0.5);
  const xValueText = createSignal('x = 0.50');
  const yValueText = createSignal('f(x) = 1.50');

  // =============================================================
  // Build tick marks data
  // =============================================================
  const xTicks: number[] = [];
  for (let x = X_MIN; x <= X_MAX; x++) {
    if (x !== 0) xTicks.push(x);
  }
  const yTicks: number[] = [];
  for (let y = Y_MIN; y <= Y_MAX; y++) {
    if (y !== 0) yTicks.push(y);
  }

  // =============================================================
  // Build curve sample points (line y = x + 1 with gap at x = 1)
  // =============================================================
  const CURVE_SAMPLES = 200;
  const GAP = 0.03; // gap radius around x = 1

  const leftCurvePoints: [number, number][] = [];
  const rightCurvePoints: [number, number][] = [];

  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const t = i / CURVE_SAMPLES;
    const x = X_MIN + (X_MAX - X_MIN) * t;

    if (x < 1 - GAP) {
      leftCurvePoints.push([x * SCALE, -f(x) * SCALE]);
    } else if (x > 1 + GAP) {
      rightCurvePoints.push([x * SCALE, -f(x) * SCALE]);
    }
  }

  // =============================================================
  // Equations
  // =============================================================
  const funcEq = createRef<MathEquation>();
  const limitEq = createRef<MathEquation>();

  const funcTex = MathEquation.colorize([
    {tex: 'f(x)', color: colors.function},
    {tex: ' = ', color: colors.operator},
    {tex: '\\frac{x^2 - 1}{x - 1}', color: colors.variable},
  ]);

  // =============================================================
  // Scene tree
  // =============================================================
  view.add(
    <Camera ref={camera}>
      {/* --- X Axis --- */}
      <Line
        ref={xAxis}
        stroke={colors.axis}
        lineWidth={2}
        endArrow
        arrowSize={10}
        end={0}
        points={[
          [pxLeft - 20, 0],
          [pxRight + 20, 0],
        ]}
      />
      {/* --- Y Axis --- */}
      <Line
        ref={yAxis}
        stroke={colors.axis}
        lineWidth={2}
        endArrow
        arrowSize={10}
        end={0}
        points={[
          [0, pxBottom + 20],
          [0, pxTop - 20],
        ]}
      />

      {/* --- Axis labels --- */}
      <Txt
        ref={xLabel}
        text="x"
        fill={colors.axis}
        fontFamily={fonts.label}
        fontSize={20}
        x={pxRight + 35}
        y={15}
        opacity={0}
      />
      <Txt
        ref={yLabel}
        text="y"
        fill={colors.axis}
        fontFamily={fonts.label}
        fontSize={20}
        x={-15}
        y={pxTop - 30}
        opacity={0}
      />

      {/* --- X tick marks --- */}
      {...xTicks.map((val) => (
        <>
          <Line
            stroke={colors.axis}
            lineWidth={1.5}
            points={[
              [val * SCALE, -5],
              [val * SCALE, 5],
            ]}
            opacity={0.6}
          />
          <Txt
            text={val.toString()}
            fill={colors.axis}
            fontFamily={fonts.label}
            fontSize={14}
            x={val * SCALE}
            y={18}
            opacity={0.5}
          />
        </>
      ))}

      {/* --- Y tick marks --- */}
      {...yTicks.map((val) => (
        <>
          <Line
            stroke={colors.axis}
            lineWidth={1.5}
            points={[
              [-5, -val * SCALE],
              [5, -val * SCALE],
            ]}
            opacity={0.6}
          />
          <Txt
            text={val.toString()}
            fill={colors.axis}
            fontFamily={fonts.label}
            fontSize={14}
            x={-18}
            y={-val * SCALE}
            opacity={0.5}
          />
        </>
      ))}

      {/* --- Curve: left segment (x < 1) --- */}
      <Line
        ref={curveLeft}
        stroke={colors.function}
        lineWidth={3}
        end={0}
        shadowColor={colors.function}
        shadowBlur={10}
        points={leftCurvePoints}
      />

      {/* --- Curve: right segment (x > 1) --- */}
      <Line
        ref={curveRight}
        stroke={colors.function}
        lineWidth={3}
        end={0}
        shadowColor={colors.function}
        shadowBlur={10}
        points={rightCurvePoints}
      />

      {/* --- Hole at x=1, y=2 --- */}
      <Circle
        ref={hole}
        x={1 * SCALE}
        y={-2 * SCALE}
        width={16}
        height={16}
        stroke={colors.function}
        lineWidth={2.5}
        fill={null}
        opacity={0}
      />

      {/* --- Vertical dashed line at x=1 --- */}
      <Line
        ref={dashedVertical}
        stroke={colors.axis}
        lineWidth={1.5}
        lineDash={[8, 6]}
        opacity={0}
        points={[
          [1 * SCALE, pxBottom],
          [1 * SCALE, pxTop],
        ]}
      />

      {/* --- Horizontal limit line at y=2 --- */}
      <Line
        ref={limitLine}
        stroke={colors.constant}
        lineWidth={2}
        lineDash={[10, 6]}
        opacity={0}
        shadowColor={colors.constant}
        shadowBlur={8}
        points={[
          [pxLeft, -2 * SCALE],
          [pxRight, -2 * SCALE],
        ]}
      />

      {/* --- Approaching point --- */}
      <Circle
        ref={approachPoint}
        width={14}
        height={14}
        fill={colors.geoPrimary}
        shadowColor={colors.geoPrimary}
        shadowBlur={12}
        opacity={0}
        x={() => approachX() * SCALE}
        y={() => -f(approachX()) * SCALE}
      />

      {/* --- Epsilon band (horizontal around y=2) --- */}
      <Rect
        ref={epsilonBand}
        x={0}
        y={-2 * SCALE}
        width={pxRight - pxLeft}
        height={0}
        fill={colors.constant}
        opacity={0}
      />

      {/* --- Delta band (vertical around x=1) --- */}
      <Rect
        ref={deltaBand}
        x={1 * SCALE}
        y={-2 * SCALE}
        width={0}
        height={0}
        fill={colors.geoSecondary}
        opacity={0}
      />
    </Camera>,
  );

  // Value labels (outside camera so they stay in screen space)
  view.add(
    <>
      <Txt
        ref={xValueLabel}
        text={() => xValueText()}
        fill={colors.variable}
        fontFamily={fonts.label}
        fontSize={24}
        x={-700}
        y={400}
        opacity={0}
      />
      <Txt
        ref={yValueLabel}
        text={() => yValueText()}
        fill={colors.constant}
        fontFamily={fonts.label}
        fontSize={24}
        x={-700}
        y={440}
        opacity={0}
      />
    </>,
  );

  // Equations (outside camera, fixed on screen)
  view.add(
    <>
      <MathEquation
        ref={funcEq}
        tex={funcTex}
        baseFill={colors.text}
        texWidth={340}
        x={640}
        y={-380}
        opacity={0}
      />
      <MathEquation
        ref={limitEq}
        tex={'\\phantom{x}'}
        baseFill={colors.text}
        texWidth={420}
        x={640}
        y={-280}
        opacity={0}
      />
    </>,
  );

  // =============================================================
  // BEAT 1 (0-5s): Axes draw in, labels appear
  // =============================================================
  yield* all(
    xAxis().end(1, 2, easeInOutCubic),
    yAxis().end(1, 2, easeInOutCubic),
  );
  yield* waitFor(0.5);
  yield* all(
    xLabel().opacity(1, 0.8, easeOutCubic),
    yLabel().opacity(1, 0.8, easeOutCubic),
  );
  yield* waitFor(2);

  // =============================================================
  // BEAT 2 (5-20s): Plot the curve y = x + 1 with hole at x=1
  // =============================================================
  yield* all(
    curveLeft().end(1, 2.5, easeInOutCubic),
    curveRight().end(1, 2.5, easeInOutCubic),
  );
  yield* waitFor(0.5);

  // Show the hole
  yield* hole().opacity(1, 0.6, easeOutCubic);
  yield* waitFor(1);

  // Show equation
  yield* funcEq().opacity(1, 1, easeOutCubic);
  yield* waitFor(1.5);
  yield* funcEq().emphasize(0.5);
  yield* waitFor(1.5);
  yield* funcEq().deemphasize(0.4);
  yield* waitFor(3);

  // =============================================================
  // BEAT 3 (20-40s): Approach from the left
  // =============================================================
  // Show dashed vertical line at x = 1
  yield* dashedVertical().opacity(0.4, 0.8, easeOutCubic);
  yield* waitFor(0.5);

  // Show the approaching point and value labels
  approachX(0.0);
  yield* all(
    approachPoint().opacity(1, 0.5, easeOutCubic),
    xValueLabel().opacity(1, 0.5, easeOutCubic),
    yValueLabel().opacity(1, 0.5, easeOutCubic),
  );

  // Approach values from left: 0.5, 0.9, 0.99, 0.999
  const leftApproach = [0.5, 0.9, 0.99, 0.999];
  for (const xVal of leftApproach) {
    const yVal = f(xVal);
    xValueText(`x = ${xVal.toFixed(xVal >= 0.99 ? 3 : 2)}`);
    yValueText(`f(x) = ${yVal.toFixed(xVal >= 0.99 ? 3 : 2)}`);
    yield* approachX(xVal, xVal === 0.5 ? 2 : 1.2, easeInOutCubic);
    yield* waitFor(xVal >= 0.99 ? 1.5 : 1);
  }

  // Pause to let the convergence sink in
  yield* waitFor(1.5);

  // =============================================================
  // BEAT 4 (40-55s): Approach from the right
  // =============================================================
  // Jump to right side
  approachX(2.0);
  approachPoint().fill(colors.geoSecondary);
  approachPoint().shadowColor(colors.geoSecondary);
  yield* waitFor(0.3);

  const rightApproach = [1.5, 1.1, 1.01, 1.001];
  for (const xVal of rightApproach) {
    const yVal = f(xVal);
    xValueText(`x = ${xVal.toFixed(xVal <= 1.01 ? 3 : 2)}`);
    yValueText(`f(x) = ${yVal.toFixed(xVal <= 1.01 ? 3 : 2)}`);
    yield* approachX(xVal, xVal === 1.5 ? 2 : 1.2, easeInOutCubic);
    yield* waitFor(xVal <= 1.01 ? 1.5 : 1);
  }

  yield* waitFor(0.5);

  // Show horizontal limit line at y=2
  yield* limitLine().opacity(0.5, 1, easeOutCubic);
  yield* waitFor(1);

  // =============================================================
  // BEAT 5 (55-75s): Limit equation and emphasis
  // =============================================================
  // Hide approaching point and value labels
  yield* all(
    approachPoint().opacity(0, 0.5),
    xValueLabel().opacity(0, 0.5),
    yValueLabel().opacity(0, 0.5),
  );
  yield* waitFor(0.5);

  // Show limit equation
  const limitTex = MathEquation.colorize([
    {tex: '\\lim_{x \\to 1}', color: colors.operator},
    {tex: '\\,', color: colors.operator},
    {tex: 'f(x)', color: colors.function},
    {tex: ' = ', color: colors.operator},
    {tex: '2', color: colors.constant},
  ]);
  limitEq().setTex(limitTex);
  yield* limitEq().opacity(1, 1, easeOutCubic);
  yield* waitFor(2);

  yield* limitEq().emphasize(0.6);
  yield* waitFor(2);
  yield* limitEq().deemphasize(0.4);
  yield* waitFor(1);

  // Emphasize that f(1) is undefined: flash the hole
  yield* all(
    hole().lineWidth(5, 0.4, easeOutCubic),
    hole().width(24, 0.4, easeOutCubic),
    hole().height(24, 0.4, easeOutCubic),
  );
  yield* waitFor(0.8);
  yield* all(
    hole().lineWidth(2.5, 0.6),
    hole().width(16, 0.6),
    hole().height(16, 0.6),
  );
  yield* waitFor(1);

  // Morph equation to show undefined note
  const undefinedTex = MathEquation.colorize([
    {tex: 'f(1)', color: colors.function},
    {tex: '\\text{ is }', color: colors.operator},
    {tex: '\\text{undefined}', color: colors.error},
    {tex: '\\text{, but }', color: colors.operator},
    {tex: '\\lim_{x \\to 1} f(x)', color: colors.function},
    {tex: ' = ', color: colors.operator},
    {tex: '2', color: colors.constant},
  ]);
  yield* limitEq().morphTo(undefinedTex, 1.5);
  yield* waitFor(2);

  // Flash hole again
  yield* all(
    hole().stroke(colors.highlight, 0.3),
    hole().lineWidth(4, 0.3),
  );
  yield* waitFor(0.6);
  yield* all(
    hole().stroke(colors.function, 0.4),
    hole().lineWidth(2.5, 0.4),
  );
  yield* waitFor(2);

  // =============================================================
  // BEAT 6 (75-90s): Epsilon-delta visualization
  // =============================================================

  // Morph equation back to clean limit
  const cleanLimitTex = MathEquation.colorize([
    {tex: '\\forall\\,', color: colors.operator},
    {tex: '\\varepsilon', color: colors.constant},
    {tex: ' > 0,\\;\\exists\\,', color: colors.operator},
    {tex: '\\delta', color: colors.geoSecondary},
    {tex: ' > 0', color: colors.operator},
  ]);
  yield* limitEq().morphTo(cleanLimitTex, 1.2);
  yield* waitFor(0.5);

  // Show epsilon band (horizontal band around y=2)
  const epsilon = 0.6;
  yield* all(
    epsilonBand().opacity(0.15, 0.8, easeOutCubic),
    epsilonBand().height(2 * epsilon * SCALE, 0.8, springSmooth),
  );
  yield* waitFor(0.5);

  // Show delta band (vertical band around x=1)
  const delta = 0.6;
  yield* all(
    deltaBand().opacity(0.15, 0.8, easeOutCubic),
    deltaBand().width(2 * delta * SCALE, 0.8, springSmooth),
    deltaBand().height(2 * epsilon * SCALE, 0.8, springSmooth),
  );
  yield* waitFor(1.5);

  // Shrink epsilon -> shrink delta
  const epsilon2 = 0.3;
  const delta2 = 0.3;
  yield* all(
    epsilonBand().height(2 * epsilon2 * SCALE, 1.5, springSmooth),
    deltaBand().width(2 * delta2 * SCALE, 1.5, springSmooth),
    deltaBand().height(2 * epsilon2 * SCALE, 1.5, springSmooth),
  );
  yield* waitFor(1.5);

  // Shrink again
  const epsilon3 = 0.12;
  const delta3 = 0.12;
  yield* all(
    epsilonBand().height(2 * epsilon3 * SCALE, 1.5, springSmooth),
    deltaBand().width(2 * delta3 * SCALE, 1.5, springSmooth),
    deltaBand().height(2 * epsilon3 * SCALE, 1.5, springSmooth),
  );
  yield* waitFor(2);

  // =============================================================
  // Fade out everything
  // =============================================================
  yield* all(
    xAxis().opacity(0, 2),
    yAxis().opacity(0, 2),
    xLabel().opacity(0, 2),
    yLabel().opacity(0, 2),
    curveLeft().opacity(0, 2),
    curveRight().opacity(0, 2),
    hole().opacity(0, 2),
    dashedVertical().opacity(0, 2),
    limitLine().opacity(0, 2),
    epsilonBand().opacity(0, 2),
    deltaBand().opacity(0, 2),
    funcEq().opacity(0, 2),
    limitEq().opacity(0, 2),
  );
  yield* waitFor(2);
});
