/** Numerical calculus utilities for animation computations. */

/**
 * Compute the numerical derivative of a function at a point using the
 * central difference approximation: (f(x+h) - f(x-h)) / (2h).
 *
 * @param fn - The function to differentiate.
 * @param x  - The point at which to evaluate the derivative.
 * @param h  - Step size for the finite difference (default 1e-6).
 * @returns The approximate value of f'(x).
 */
export function numericalDerivative(
  fn: (x: number) => number,
  x: number,
  h: number = 1e-6,
): number {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

/**
 * Compute a definite integral using Simpson's rule.
 *
 * Simpson's rule approximates the integral by fitting parabolic arcs
 * through successive groups of three sample points.  The number of
 * sub-intervals `n` must be even; if an odd value is supplied it will
 * be incremented by one.
 *
 * @param fn - The integrand.
 * @param a  - Lower bound of integration.
 * @param b  - Upper bound of integration.
 * @param n  - Number of sub-intervals (default 100, must be even).
 * @returns The approximate value of the integral from a to b.
 */
export function numericalIntegral(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number = 100,
): number {
  // Simpson's rule requires an even number of intervals.
  if (n % 2 !== 0) {
    n += 1;
  }

  const h = (b - a) / n;
  let sum = fn(a) + fn(b);

  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += i % 2 === 0 ? 2 * fn(x) : 4 * fn(x);
  }

  return (h / 3) * sum;
}

/**
 * Return a function representing the tangent line to `fn` at the point `x0`.
 *
 * The tangent line is: y = f(x0) + f'(x0) * (x - x0).
 *
 * @param fn - The original function.
 * @param x0 - The point of tangency.
 * @returns A function that evaluates the tangent line at any x.
 */
export function tangentLine(
  fn: (x: number) => number,
  x0: number,
): (x: number) => number {
  const y0 = fn(x0);
  const slope = numericalDerivative(fn, x0);
  return (x: number) => y0 + slope * (x - x0);
}

/**
 * Return a function representing the secant line through two points on `fn`.
 *
 * The secant line passes through (x1, f(x1)) and (x2, f(x2)).
 *
 * @param fn - The original function.
 * @param x1 - First x-coordinate.
 * @param x2 - Second x-coordinate.
 * @returns A function that evaluates the secant line at any x.
 */
export function secantLine(
  fn: (x: number) => number,
  x1: number,
  x2: number,
): (x: number) => number {
  const y1 = fn(x1);
  const y2 = fn(x2);
  const slope = (y2 - y1) / (x2 - x1);
  return (x: number) => y1 + slope * (x - x1);
}

/**
 * Rectangle data produced by {@link riemannSum}.
 */
export interface RiemannRect {
  /** Left edge x-coordinate of the rectangle. */
  x: number;
  /** Width of the rectangle (always positive). */
  width: number;
  /** Signed height of the rectangle (negative when f < 0). */
  height: number;
}

/**
 * Result of a {@link riemannSum} computation.
 */
export interface RiemannSumResult {
  /** Individual rectangle data suitable for visualisation. */
  rects: RiemannRect[];
  /** The total Riemann sum (signed area). */
  sum: number;
}

/**
 * Compute a Riemann sum and return per-rectangle data for visualisation.
 *
 * @param fn   - The function to integrate.
 * @param a    - Lower bound.
 * @param b    - Upper bound.
 * @param n    - Number of rectangles.
 * @param type - Sample point placement: `'left'`, `'right'`, or `'midpoint'`.
 * @returns An object containing the rectangle descriptors and the total sum.
 */
export function riemannSum(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number,
  type: 'left' | 'right' | 'midpoint',
): RiemannSumResult {
  const width = (b - a) / n;
  const rects: RiemannRect[] = [];
  let sum = 0;

  for (let i = 0; i < n; i++) {
    const leftEdge = a + i * width;
    let sampleX: number;

    switch (type) {
      case 'left':
        sampleX = leftEdge;
        break;
      case 'right':
        sampleX = leftEdge + width;
        break;
      case 'midpoint':
        sampleX = leftEdge + width / 2;
        break;
    }

    const height = fn(sampleX);
    sum += height * width;
    rects.push({x: leftEdge, width, height});
  }

  return {rects, sum};
}

/**
 * A single sample in the sequence produced by {@link limitApproach}.
 */
export interface LimitSample {
  /** The x-value approaching the target. */
  x: number;
  /** The corresponding function value f(x). */
  y: number;
}

/**
 * Result of a {@link limitApproach} computation.
 */
export interface LimitResult {
  /** The sequence of sample points approaching the target from both sides. */
  values: LimitSample[];
  /** The estimated limit (average of the two closest samples). */
  limit: number;
}

/**
 * Generate a sequence of (x, f(x)) pairs that approach a target value
 * from both sides, and estimate the limit.
 *
 * The sequence uses exponentially decreasing offsets so that each
 * successive sample is ten times closer to the target than the previous one.
 *
 * @param fn     - The function to evaluate.
 * @param target - The x-value to approach.
 * @param steps  - Number of samples from each side (default 10).
 * @returns An object with the sample sequence and the estimated limit.
 */
export function limitApproach(
  fn: (x: number) => number,
  target: number,
  steps: number = 10,
): LimitResult {
  const values: LimitSample[] = [];

  // Approach from the left (target - offset) and right (target + offset),
  // interleaving the two sides.
  for (let i = 1; i <= steps; i++) {
    const offset = Math.pow(10, -i);

    const xLeft = target - offset;
    values.push({x: xLeft, y: fn(xLeft)});

    const xRight = target + offset;
    values.push({x: xRight, y: fn(xRight)});
  }

  // Estimate the limit from the two closest samples.
  const closestLeft = fn(target - Math.pow(10, -steps));
  const closestRight = fn(target + Math.pow(10, -steps));
  const limit = (closestLeft + closestRight) / 2;

  return {values, limit};
}

/**
 * A single iteration of Newton's method as returned by {@link newtonMethod}.
 */
export interface NewtonStep {
  /** The current x estimate. */
  x: number;
  /** The function value f(x) at this estimate. */
  y: number;
  /** The x-intercept of the tangent line at this point (next estimate). */
  tangentRoot: number;
}

/**
 * Result of {@link newtonMethod}.
 */
export interface NewtonResult {
  /** Data for each iteration, useful for animating the process. */
  steps: NewtonStep[];
  /** The final root estimate. */
  root: number;
}

/**
 * Perform Newton's method to find a root of `fn`, returning per-iteration
 * data suitable for step-by-step animation.
 *
 * Each iteration computes the tangent line at the current estimate and
 * finds where it crosses the x-axis:
 *   x_{n+1} = x_n - f(x_n) / f'(x_n)
 *
 * @param fn         - The function whose root is sought.
 * @param x0         - Initial guess.
 * @param iterations - Maximum number of iterations (default 10).
 * @returns An object containing the iteration steps and the final root estimate.
 */
export function newtonMethod(
  fn: (x: number) => number,
  x0: number,
  iterations: number = 10,
): NewtonResult {
  const steps: NewtonStep[] = [];
  let x = x0;

  for (let i = 0; i < iterations; i++) {
    const y = fn(x);
    const slope = numericalDerivative(fn, x);

    // Guard against near-zero derivative to avoid divergence.
    if (Math.abs(slope) < 1e-12) {
      break;
    }

    const tangentRoot = x - y / slope;
    steps.push({x, y, tangentRoot});
    x = tangentRoot;
  }

  return {steps, root: x};
}
