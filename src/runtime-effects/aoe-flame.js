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
  legacyDomFlameAoeRuntime,
} = {}) {
  if (!legacyDomFlameAoeRuntime || typeof legacyDomFlameAoeRuntime.play !== "function") {
    return { handled: false };
  }
  legacyDomFlameAoeRuntime.play();
  return { handled: true };
}
