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
