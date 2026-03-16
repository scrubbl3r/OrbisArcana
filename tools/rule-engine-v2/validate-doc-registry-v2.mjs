import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

export function validateDocRegistryV2({
  tag,
  keys,
  docPaths,
  label,
  requireMarkdown = false,
}) {
  const seenPaths = new Set();
  for (const key of keys) {
    const rel = docPaths[key];
    if (!rel) {
      failCheck(tag, `missing doc path for key: ${key}`);
    }
    if (!String(rel).startsWith("docs/")) {
      failCheck(tag, `${label} path must be under docs/: ${key} -> ${rel}`);
    }
    if (requireMarkdown && !String(rel).endsWith(".md")) {
      failCheck(tag, `${label} path must be markdown: ${key} -> ${rel}`);
    }
    if (seenPaths.has(rel)) {
      failCheck(tag, `duplicate ${label} path mapped: ${rel}`);
    }
    seenPaths.add(rel);
    if (!existsSync(resolve(process.cwd(), rel))) {
      failCheck(tag, `${label} file missing on disk: ${rel}`);
    }
  }
}
