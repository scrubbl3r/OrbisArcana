// Shared text-normalization utility helpers.
// Used broadly by validators/checks for stable token/id normalization.
// Keep output normalization conservative and deterministic.
export function asLowerText(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export function asTrimText(v) {
  // Non-string values intentionally collapse to empty text.
  return typeof v === "string" ? v.trim() : "";
}
