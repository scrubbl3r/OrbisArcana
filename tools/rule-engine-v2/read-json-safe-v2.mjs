// Safe JSON reader returning parsed value or null on read/parse failure.
import { readJsonCore } from "./read-json-core-v2.mjs";
// Convenience wrapper for optional artifact reads where null is acceptable.
// Use the strict core reader for diagnostics, then collapse failures to null.
export function readJsonSafe(path) {
  if (typeof path !== "string" || !path.trim()) {
    throw new Error("readJsonSafe requires a non-empty file path");
  }
  const result = readJsonCore(path);
  return result.ok ? result.value : null;
}
