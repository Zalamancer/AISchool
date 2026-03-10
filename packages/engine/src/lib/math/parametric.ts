/** Parametric curve and surface utilities for animation. */

import {type Vec2, lengthVec2, normalizeVec2} from './linalg';

/**
 * Uniformly sample a parametric curve over a parameter range.
 *
 * @param fn - Parametric function mapping t to a 2D point.
 * @param tRange - The [start, end] parameter range to sample over.
 * @param samples - Number of sample points (must be >= 2).
 * @returns An array of sampled Vec2 points.
 */
export function sampleCurve(
  fn: (t: number) => Vec2,
  tRange: [number, number],
  samples: number,
): Vec2[] {
  const [tStart, tEnd] = tRange;
  const points: Vec2[] = [];
  const steps = Math.max(samples - 1, 1);
  for (let i = 0; i < samples; i++) {
    const t = tStart + (tEnd - tStart) * (i / steps);
    points.push(fn(t));
  }
  return points;
}

/**
 * Adaptively sample a parametric curve, placing more points where curvature is
 * high and fewer where the curve is nearly straight.
 *
 * Uses recursive midpoint subdivision: a segment is subdivided when the
 * midpoint deviates from the linear interpolation by more than `tolerance`.
 *
 * @param fn - Parametric function mapping t to a 2D point.
 * @param tRange - The [start, end] parameter range to sample over.
 * @param maxSamples - Upper bound on the number of sample points.
 * @param tolerance - Maximum allowed deviation before subdividing (default 0.01).
 * @returns An array of adaptively sampled Vec2 points.
 */
export function sampleAdaptive(
  fn: (t: number) => Vec2,
  tRange: [number, number],
  maxSamples: number,
  tolerance: number = 0.01,
): Vec2[] {
  const [tStart, tEnd] = tRange;
  const points: Vec2[] = [];
  let sampleCount = 0;

  function subdivide(
    t0: number,
    p0: Vec2,
    t1: number,
    p1: Vec2,
  ): void {
    if (sampleCount >= maxSamples) return;

    const tMid = (t0 + t1) / 2;
    const pMid = fn(tMid);
    const linearMid: Vec2 = [
      (p0[0] + p1[0]) / 2,
      (p0[1] + p1[1]) / 2,
    ];
    const deviation = lengthVec2([
      pMid[0] - linearMid[0],
      pMid[1] - linearMid[1],
    ]);

    if (deviation > tolerance && sampleCount < maxSamples) {
      subdivide(t0, p0, tMid, pMid);
      points.push(pMid);
      sampleCount++;
      subdivide(tMid, pMid, t1, p1);
    } else {
      points.push(pMid);
      sampleCount++;
    }
  }

  const pStart = fn(tStart);
  const pEnd = fn(tEnd);
  points.push(pStart);
  sampleCount++;

  subdivide(tStart, pStart, tEnd, pEnd);

  points.push(pEnd);
  sampleCount++;

  return points;
}

/**
 * Approximate the arc length of a parametric curve using piecewise linear
 * approximation.
 *
 * @param fn - Parametric function mapping t to a 2D point.
 * @param tRange - The [start, end] parameter range.
 * @param samples - Number of sample points for the approximation (default 256).
 * @returns The approximate arc length.
 */
export function arcLength(
  fn: (t: number) => Vec2,
  tRange: [number, number],
  samples: number = 256,
): number {
  const pts = sampleCurve(fn, tRange, samples);
  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    length += lengthVec2([
      pts[i][0] - pts[i - 1][0],
      pts[i][1] - pts[i - 1][1],
    ]);
  }
  return length;
}

/**
 * Compute the curvature of a parametric curve at parameter t using central
 * difference numerical derivatives.
 *
 * Curvature = |x'y'' - y'x''| / (x'^2 + y'^2)^(3/2)
 *
 * @param fn - Parametric function mapping t to a 2D point.
 * @param t - The parameter value at which to evaluate curvature.
 * @param h - Step size for numerical differentiation (default 1e-5).
 * @returns The scalar curvature value.
 */
export function curvature(
  fn: (t: number) => Vec2,
  t: number,
  h: number = 1e-5,
): number {
  const pPrev = fn(t - h);
  const pCurr = fn(t);
  const pNext = fn(t + h);

  // First derivatives (central difference)
  const dx = (pNext[0] - pPrev[0]) / (2 * h);
  const dy = (pNext[1] - pPrev[1]) / (2 * h);

  // Second derivatives (central difference)
  const ddx = (pNext[0] - 2 * pCurr[0] + pPrev[0]) / (h * h);
  const ddy = (pNext[1] - 2 * pCurr[1] + pPrev[1]) / (h * h);

  const numerator = Math.abs(dx * ddy - dy * ddx);
  const speedCubed = Math.pow(dx * dx + dy * dy, 1.5);

  if (speedCubed === 0) return 0;
  return numerator / speedCubed;
}

/**
 * Compute the normalized tangent vector of a parametric curve at parameter t.
 *
 * Uses central difference to approximate the derivative, then normalizes.
 *
 * @param fn - Parametric function mapping t to a 2D point.
 * @param t - The parameter value at which to evaluate the tangent.
 * @param h - Step size for numerical differentiation (default 1e-5).
 * @returns The unit tangent vector as a Vec2.
 */
export function tangentVector(
  fn: (t: number) => Vec2,
  t: number,
  h: number = 1e-5,
): Vec2 {
  const pPrev = fn(t - h);
  const pNext = fn(t + h);
  const dx = pNext[0] - pPrev[0];
  const dy = pNext[1] - pPrev[1];
  return normalizeVec2([dx, dy]);
}

/**
 * Compute the normal vector (perpendicular to the tangent) of a parametric
 * curve at parameter t.
 *
 * The normal is obtained by rotating the tangent 90 degrees counter-clockwise.
 *
 * @param fn - Parametric function mapping t to a 2D point.
 * @param t - The parameter value at which to evaluate the normal.
 * @param h - Step size for numerical differentiation (default 1e-5).
 * @returns The unit normal vector as a Vec2.
 */
export function normalVector(
  fn: (t: number) => Vec2,
  t: number,
  h: number = 1e-5,
): Vec2 {
  const [tx, ty] = tangentVector(fn, t, h);
  return [-ty, tx];
}

/**
 * Create a new parametric function that linearly interpolates between two
 * parametric curves.
 *
 * When blend = 0 the result follows fn1 exactly; when blend = 1 it follows
 * fn2 exactly. Values between 0 and 1 produce an intermediate curve.
 *
 * @param fn1 - The first parametric curve.
 * @param fn2 - The second parametric curve.
 * @param blend - Interpolation factor in [0, 1].
 * @returns A new parametric function producing the blended curve.
 */
export function lerpCurves(
  fn1: (t: number) => Vec2,
  fn2: (t: number) => Vec2,
  blend: number,
): (t: number) => Vec2 {
  return (t: number): Vec2 => {
    const p1 = fn1(t);
    const p2 = fn2(t);
    return [
      p1[0] + (p2[0] - p1[0]) * blend,
      p1[1] + (p2[1] - p1[1]) * blend,
    ];
  };
}

// ---------------------------------------------------------------------------
// Common parametric curves
// ---------------------------------------------------------------------------

/**
 * Create a circle parametric curve.
 *
 * Parameter t in [0, 2*PI] traces a full circle.
 *
 * @param radius - Radius of the circle.
 * @returns A parametric function for the circle.
 */
export function circle(radius: number): (t: number) => Vec2 {
  return (t: number): Vec2 => [
    radius * Math.cos(t),
    radius * Math.sin(t),
  ];
}

/**
 * Create an ellipse parametric curve.
 *
 * Parameter t in [0, 2*PI] traces a full ellipse.
 *
 * @param a - Semi-major axis (horizontal radius).
 * @param b - Semi-minor axis (vertical radius).
 * @returns A parametric function for the ellipse.
 */
export function ellipse(a: number, b: number): (t: number) => Vec2 {
  return (t: number): Vec2 => [
    a * Math.cos(t),
    b * Math.sin(t),
  ];
}

/**
 * Create a Lissajous curve parametric function.
 *
 * x(t) = sin(a*t + delta), y(t) = sin(b*t)
 *
 * Parameter t in [0, 2*PI] traces one period (assuming integer a, b).
 *
 * @param a - Frequency multiplier for x.
 * @param b - Frequency multiplier for y.
 * @param delta - Phase offset for x (in radians).
 * @returns A parametric function for the Lissajous curve.
 */
export function lissajous(
  a: number,
  b: number,
  delta: number,
): (t: number) => Vec2 {
  return (t: number): Vec2 => [
    Math.sin(a * t + delta),
    Math.sin(b * t),
  ];
}

/**
 * Create an Archimedean spiral parametric curve.
 *
 * r(t) = growth * t, producing a spiral that grows linearly with t.
 *
 * @param growth - Rate at which the spiral expands per radian.
 * @returns A parametric function for the spiral.
 */
export function spiral(growth: number): (t: number) => Vec2 {
  return (t: number): Vec2 => {
    const r = growth * t;
    return [r * Math.cos(t), r * Math.sin(t)];
  };
}

/**
 * Create a heart-shaped parametric curve.
 *
 * Uses the classic heart curve parametrisation:
 *   x(t) = 16 sin^3(t)
 *   y(t) = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
 *
 * Parameter t in [0, 2*PI] traces the full heart. The output is scaled down
 * by 1/16 so the heart fits roughly within a unit bounding box.
 *
 * @returns A parametric function for the heart curve.
 */
export function heart(): (t: number) => Vec2 {
  return (t: number): Vec2 => {
    const sinT = Math.sin(t);
    const x = 16 * sinT * sinT * sinT;
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    return [x / 16, y / 16];
  };
}
