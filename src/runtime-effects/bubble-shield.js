/**
 * Canonical bubble shield runtime effect implementation.
 */
export function executeBubbleShield({
  activateBubbleShield,
  durationMs = 8000,
} = {}) {
  if (typeof activateBubbleShield !== "function") {
    return { handled: false };
  }
  activateBubbleShield({ durationMs });
  return { handled: true };
}
