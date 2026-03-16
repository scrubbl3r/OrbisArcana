export function toNumberOr(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function toTrimmedText(v) {
  return typeof v === "string" ? v.trim() : "";
}
