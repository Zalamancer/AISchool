/**
 * Spring physics interpolation for MathVision animations.
 *
 * Use damping=0.7 for shapes/vectors (slight bounce).
 * Use damping=1.0 for camera and UI (no bounce).
 */

/**
 * Core spring function — maps normalized time [0,1] to an eased value.
 *
 * @param t        Normalized time 0–1
 * @param damping  ζ: 0.7 = underdamped (bouncy), 1.0 = critically damped, >1 = overdamped
 * @param frequency ω: higher = faster oscillation (default 4.0)
 */
export function spring(
  t: number,
  damping = 0.7,
  frequency = 4.0,
): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  if (damping >= 1) {
    // Critically / over-damped — no overshoot
    return 1 - (1 + frequency * t) * Math.exp(-frequency * t);
  }

  // Under-damped — overshoot and settle
  const wd = frequency * Math.sqrt(1 - damping * damping);
  return (
    1 -
    Math.exp(-damping * frequency * t) *
      (Math.cos(wd * t) + ((damping * frequency) / wd) * Math.sin(wd * t))
  );
}

/** Preset: bouncy spring for vectors & shapes (ζ=0.7) */
export function springBouncy(t: number): number {
  return spring(t, 0.7, 4.0);
}

/** Preset: critically-damped spring for camera & UI (ζ=1.0) */
export function springSmooth(t: number): number {
  return spring(t, 1.0, 4.0);
}
