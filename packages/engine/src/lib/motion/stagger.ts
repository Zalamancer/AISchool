/**
 * Stagger utility — returns a delay in seconds for element i of n,
 * so multiple elements enter in a wave.
 */
export function staggerDelay(
  index: number,
  total: number,
  totalDuration = 0.4,
): number {
  if (total <= 1) return 0;
  return (index / (total - 1)) * totalDuration;
}
