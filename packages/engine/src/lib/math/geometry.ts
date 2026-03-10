/** Geometry utilities — unit circle points, shapes */

import type {Vec2} from './linalg';

/** Generate N evenly-spaced points on the unit circle */
export function unitCirclePoints(n: number): Vec2[] {
  const points: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    points.push([Math.cos(angle), Math.sin(angle)]);
  }
  return points;
}
