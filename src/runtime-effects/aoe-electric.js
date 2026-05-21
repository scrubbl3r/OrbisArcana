/**
 * Canonical electric AOE runtime effect implementation.
 */
export function executeAoeElectric({
  playElectricAoe,
  payload = {},
} = {}) {
  if (typeof playElectricAoe !== "function") {
    return { handled: false };
  }
  return playElectricAoe(payload) || { handled: true };
}
