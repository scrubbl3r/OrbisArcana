import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

function toArrayOrFailV2({ value, tag, label, field }) {
  if (value == null) {
    failCheck(tag, `${label} validation requires ${field}`);
  }
  if (typeof value[Symbol.iterator] !== "function") {
    failCheck(tag, `${label} ${field} must be iterable`);
  }
  return Array.from(value);
}

export function validateDocRegistryV2({
  tag,
  keys,
  relPaths,
  label,
  requireMarkdown = false,
}) {
  if (!tag) {
    failCheck("validate-doc-registry:v2", "doc registry validation requires check tag");
  }
  const seenPaths = new Set();
  if (!label) {
    failCheck(tag, "doc registry validation requires label");
  }
  const keysArr = toArrayOrFailV2({ value: keys, tag, label, field: "keys" });
  if (!keysArr.length) {
    failCheck(tag, `${label} key registry is empty`);
  }
  const relArr = toArrayOrFailV2({ value: relPaths, tag, label, field: "relPaths" });
  if (relArr.length !== keysArr.length) {
    failCheck(
      tag,
      `${label} key/path count mismatch: keys=${keysArr.length} relPaths=${relArr.length}`
    );
  }
  for (let index = 0; index < relArr.length; index += 1) {
    const key = keysArr[index];
    const rel = relArr[index];
    if (typeof key !== "string") {
      failCheck(tag, `${label}[${index}] key must be a string`);
    }
    if (!key.trim()) {
      failCheck(tag, `${label}[${index}] key must be a non-empty string`);
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
