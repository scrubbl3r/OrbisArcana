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
  electricAoeRuntime,
} = {}) {
  if (!electricAoeRuntime || typeof electricAoeRuntime.play !== "function") {
    return { handled: false };
  }
  electricAoeRuntime.play();
  return { handled: true };
}
