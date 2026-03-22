import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";
import { readJsonCore } from "./read-json-core-v2.mjs";

// Read helper that preserves prior failCheck messaging semantics for callers.
// `relPath` remains in the error text so callers get stable, actionable output.
export function readJsonOrFail(tag, relPath) {
  const absPath = resolve(process.cwd(), relPath);
  const result = readJsonCore(absPath);
  if (result.ok) return result.value;

  try {
    // Preserve prior detailed message behavior for callers.
    throw result.error;
  } catch (err) {
    const msg = err instanceof Error && typeof err.message === "string" && err.message
      ? err.message
      : "unknown error";
    failCheck(tag, `unable to read ${relPath} (${msg})`);
    return null;
  }
}
