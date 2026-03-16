import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

export function validateFileTargetsV2({ tag, targets, label }) {
  if (!Array.isArray(targets) || !targets.length) {
    failCheck(tag, `${label} must be a non-empty array`);
  }
  for (const [index, relPath] of targets.entries()) {
    if (typeof relPath !== "string") {
      failCheck(tag, `${label}[${index}] path must be a string`);
    }
    if (!relPath.trim()) {
      failCheck(tag, `${label}[${index}] path is empty`);
    }
    if (!existsSync(resolve(process.cwd(), relPath))) {
      failCheck(tag, `${label}[${index}] file missing: ${relPath}`);
    }
  }
}
