// Shared helper for reading repo-relative text sources and fixtures.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
// Keeps text-source reads centralized for docs/surface checks.
// Validation intentionally stays strict to fail fast on bad caller input.
export function readRelativeText(relPath, cwd = process.cwd()) {
  if (typeof relPath !== "string" || !relPath.trim()) {
    throw new Error("readRelativeText requires a non-empty relPath string");
  }
  if (typeof cwd !== "string" || !cwd.trim()) {
    throw new Error("readRelativeText cwd must be a non-empty string");
  }
  return readFileSync(resolve(cwd, relPath), "utf8");
}
