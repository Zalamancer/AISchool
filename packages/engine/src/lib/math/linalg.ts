/** Linear algebra utilities — matrices, vectors, eigenvalues */

export type Vec2 = [number, number];
export type Mat2 = [number, number, number, number]; // row-major [a,b,c,d]

/** Multiply a 2×2 matrix by a 2D vector */
export function mulMV([a, b, c, d]: Mat2, [x, y]: Vec2): Vec2 {
  return [a * x + b * y, c * x + d * y];
}

/** Multiply two 2×2 matrices */
export function mulMM(A: Mat2, B: Mat2): Mat2 {
  return [
    A[0] * B[0] + A[1] * B[2],
    A[0] * B[1] + A[1] * B[3],
    A[2] * B[0] + A[3] * B[2],
    A[2] * B[1] + A[3] * B[3],
  ];
}

/** Determinant of a 2×2 matrix */
export function det([a, b, c, d]: Mat2): number {
  return a * d - b * c;
}

/** Eigenvalues of a 2×2 matrix (returns [λ1, λ2] or null if complex) */
export function eigenvalues([a, b, c, d]: Mat2): [number, number] | null {
  const trace = a + d;
  const determinant = det([a, b, c, d]);
  const discriminant = trace * trace - 4 * determinant;
  if (discriminant < 0) return null;
  const sqrtD = Math.sqrt(discriminant);
  return [(trace + sqrtD) / 2, (trace - sqrtD) / 2];
}

/** Linearly interpolate a point on the unit circle through a matrix transform */
export function transformUnitCirclePoint(
  matrix: Mat2,
  angle: number,
  t: number,
): Vec2 {
  const original: Vec2 = [Math.cos(angle), Math.sin(angle)];
  const transformed = mulMV(matrix, original);
  return [
    original[0] + (transformed[0] - original[0]) * t,
    original[1] + (transformed[1] - original[1]) * t,
  ];
}

/** Scale a vector by a scalar */
export function scaleVec2([x, y]: Vec2, s: number): Vec2 {
  return [x * s, y * s];
}

/** Normalize a vector to unit length */
export function normalizeVec2([x, y]: Vec2): Vec2 {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return [0, 0];
  return [x / len, y / len];
}

/** Length of a vector */
export function lengthVec2([x, y]: Vec2): number {
  return Math.sqrt(x * x + y * y);
}

/** Component-wise linear interpolation of two matrices */
export function lerpMat2(a: Mat2, b: Mat2, t: number): Mat2 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
  ];
}

/** Identity matrix */
export const IDENTITY: Mat2 = [1, 0, 0, 1];

/** Compute eigenvector for a given eigenvalue */
function eigenvectorForValue([a, b, c, d]: Mat2, lambda: number): Vec2 {
  const r0: Vec2 = [a - lambda, b];
  const r1: Vec2 = [c, d - lambda];
  // Use the row with larger absolute values for numerical stability
  const row =
    Math.abs(r0[0]) + Math.abs(r0[1]) >= Math.abs(r1[0]) + Math.abs(r1[1])
      ? r0
      : r1;
  if (Math.abs(row[0]) > Math.abs(row[1])) {
    return normalizeVec2([-row[1] / row[0], 1]);
  } else if (Math.abs(row[1]) > 0) {
    return normalizeVec2([1, -row[0] / row[1]]);
  }
  return [1, 0];
}

/** Eigenvectors of a 2×2 matrix (normalized), or null if eigenvalues are complex */
export function eigenvectors(m: Mat2): [Vec2, Vec2] | null {
  const eigs = eigenvalues(m);
  if (!eigs) return null;
  return [eigenvectorForValue(m, eigs[0]), eigenvectorForValue(m, eigs[1])];
}
