export function triggerHaptic(durationMs = 15): void {
  if (typeof window === 'undefined') return;
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(durationMs);
}
