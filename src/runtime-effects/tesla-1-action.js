/**
 * Canonical Tesla 1 spell action executor.
 */
export function executeTesla1({
  playTesla1,
  payload = {},
} = {}) {
  if (typeof playTesla1 !== "function") {
    return { handled: false };
  }
  return playTesla1(payload) || { handled: true };
}
