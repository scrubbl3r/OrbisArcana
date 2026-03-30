/**
 * Canonical flame AOE runtime effect implementation.
 */
export function executeAoeFlame({
  playFlameAoe,
} = {}) {
  if (typeof playFlameAoe !== "function") {
    return { handled: false };
  }
  playFlameAoe();
  return { handled: true };
}
