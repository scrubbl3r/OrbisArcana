export function asLowerText(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export function asTrimText(v) {
  return typeof v === "string" ? v.trim() : "";
}
