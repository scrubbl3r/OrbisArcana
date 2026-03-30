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

export function playFlameAoeRuntime({
  flameAoeRuntime,
} = {}) {
  if (!flameAoeRuntime || typeof flameAoeRuntime.play !== "function") {
    return { handled: false };
  }
  flameAoeRuntime.play();
  return { handled: true };
}
