import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readRelativeText(relPath, cwd = process.cwd()) {
  if (typeof relPath !== "string" || !relPath.trim()) {
    throw new Error("readRelativeText requires a non-empty relPath string");
  }
  if (typeof cwd !== "string" || !cwd.trim()) {
    throw new Error("readRelativeText cwd must be a non-empty string");
  }
  return readFileSync(resolve(cwd, relPath), "utf8");
}
