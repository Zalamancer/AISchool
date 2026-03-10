/**
 * Camera utilities — viewport control with critically-damped spring physics.
 * Duration: 800–1200ms depending on distance.
 */

/** Calculate camera transition duration based on travel distance (in px). */
export function cameraDuration(distance: number): number {
  const minDuration = 0.8;
  const maxDuration = 1.2;
  const maxDistance = 1000;
  return minDuration + (maxDuration - minDuration) * Math.min(distance / maxDistance, 1);
}
