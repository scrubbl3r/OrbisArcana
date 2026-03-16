import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

export function validateFileTargetsV2({ tag, targets, label }) {
  if (!Array.isArray(targets) || !targets.length) {
    failCheck(tag, `${label} must be a non-empty array`);
  }
  for (const relPath of targets) {
    if (!String(relPath).trim()) {
      failCheck(tag, `${label} path is empty`);
    }
    if (!existsSync(resolve(process.cwd(), relPath))) {
      failCheck(tag, `${label} file missing: ${relPath}`);
    }
  }
}
