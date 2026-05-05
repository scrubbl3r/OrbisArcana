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
  const result = playFlameAoe(payload);
  return result && typeof result === "object" ? result : { handled: result !== false };
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
