/**
 * Canonical shockwave runtime effect implementation.
 * Keeps receiver VFX triggering out of generic wiring code.
 */
export function executeShockwave({
  triggerShockwave,
} = {}) {
  if (typeof triggerShockwave !== "function") {
    return { handled: false };
  }
  triggerShockwave();
  return { handled: true };
}
