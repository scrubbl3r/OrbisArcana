/**
 * Canonical flame AOE runtime effect implementation.
 */
export function executeAoeFlame({
  playFlameAoe,
  payload = {},
} = {}) {
  if (typeof playFlameAoe !== "function") {
    return { handled: false };
  }
  playFlameAoe(payload);
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
