import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

export function validateDocRegistryV2({
  tag,
  keys,
  relPaths,
  label,
  requireMarkdown = false,
}) {
  const seenPaths = new Set();
  const keysArr = Array.from(keys);
  if (!keysArr.length) {
    failCheck(tag, `${label} key registry is empty`);
  }
  if (!relPaths) {
    failCheck(tag, `${label} validation requires relPaths`);
  }
  const relArr = Array.from(relPaths);
  if (relArr.length !== keysArr.length) {
    failCheck(
      tag,
      `${label} key/path count mismatch: keys=${keysArr.length} relPaths=${relArr.length}`
    );
  }
  const pairs = relArr.map((rel, idx) => ({ key: keysArr[idx], rel }));
  for (const { key, rel } of pairs) {
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
