/**
 * Canonical frost AOE runtime effect implementation.
 * Falls back to flame AOE until a dedicated frost runtime is wired.
 */
export function executeAoeFrost({
  playFrostAoe,
  playFlameAoe,
} = {}) {
  if (typeof playFrostAoe === "function") {
    playFrostAoe();
    return { handled: true };
  }
  if (typeof playFlameAoe === "function") {
    playFlameAoe();
    return { handled: true, fallback: "flame" };
  }
  return { handled: false };
}
