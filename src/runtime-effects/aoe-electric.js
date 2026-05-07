/**
 * Canonical electric AOE runtime effect implementation.
 */
export function executeAoeElectric({
  playElectricAoe,
} = {}) {
  if (typeof playElectricAoe !== "function") {
    return { handled: false };
  }
  playElectricAoe();
  return { handled: true };
}

export function playElectricAoeRuntime({
  legacyDomElectricAoeRuntime,
} = {}) {
  if (!legacyDomElectricAoeRuntime || typeof legacyDomElectricAoeRuntime.play !== "function") {
    return { handled: false };
  }
  legacyDomElectricAoeRuntime.play();
  return { handled: true };
}
