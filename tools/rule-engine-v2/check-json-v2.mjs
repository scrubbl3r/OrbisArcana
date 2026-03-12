import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";
import { readJsonCore } from "./read-json-core-v2.mjs";

export function readJsonOrFail(tag, relPath) {
  const absPath = resolve(process.cwd(), relPath);
  const result = readJsonCore(absPath);
  if (result.ok) return result.value;

  try {
    // Preserve prior detailed message behavior for callers.
    throw result.error;
  } catch (err) {
    failCheck(tag, `unable to read ${relPath} (${err?.message || err})`);
    return null;
  }
}
