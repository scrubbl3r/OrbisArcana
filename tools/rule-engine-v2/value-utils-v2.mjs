// Shared numeric/string coercion helpers for status/report generation.
// Intentionally tiny coercion layer to keep report formatting deterministic.
// These helpers are pure and side-effect free by design.
export function toNumberOr(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function toTrimmedText(v) {
  // Non-string values intentionally normalize to empty text.
  return typeof v === "string" ? v.trim() : "";
}
