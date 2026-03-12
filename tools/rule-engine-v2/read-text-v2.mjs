import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readRelativeText(relPath, cwd = process.cwd()) {
  return readFileSync(resolve(cwd, String(relPath || "")), "utf8");
}
