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
  const pairs = relArr.map((rel, idx) => ({ index: idx, key: keysArr[idx], rel }));
  for (const { index, key, rel } of pairs) {
    if (typeof key !== "string") {
      failCheck(tag, `${label}[${index}] key must be a string`);
    }
    if (rel == null) {
      failCheck(tag, `${label}[${index}] missing doc path for key: ${key}`);
    }
    if (typeof rel !== "string") {
      failCheck(tag, `${label}[${index}] path must be a string: ${key}`);
    }
    if (!rel.trim()) {
      failCheck(tag, `${label}[${index}] path is empty: ${key}`);
    }
    if (!rel.startsWith("docs/")) {
      failCheck(tag, `${label}[${index}] path must be under docs/: ${key} -> ${rel}`);
    }
    if (requireMarkdown && !rel.endsWith(".md")) {
      failCheck(tag, `${label}[${index}] path must be markdown: ${key} -> ${rel}`);
    }
    if (seenPaths.has(rel)) {
      failCheck(tag, `${label}[${index}] duplicate path mapped: ${rel}`);
    }
    seenPaths.add(rel);
    if (!existsSync(resolve(process.cwd(), rel))) {
      failCheck(tag, `${label}[${index}] file missing on disk: ${rel}`);
    }
  }
}
