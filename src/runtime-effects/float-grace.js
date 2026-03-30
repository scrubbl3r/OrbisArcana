/**
 * Canonical float grace runtime effect implementation.
 */
export function executeFloatGrace({
  grantSuperGrace,
  ms,
} = {}) {
  if (typeof grantSuperGrace !== "function") {
    return { handled: false };
  }
  grantSuperGrace(Number.isFinite(Number(ms)) ? Number(ms) : undefined);
  return { handled: true };
}
