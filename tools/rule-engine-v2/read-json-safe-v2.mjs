import { readJsonCore } from "./read-json-core-v2.mjs";

export function readJsonSafe(path) {
  if (typeof path !== "string" || !path.trim()) {
    throw new Error("readJsonSafe requires a non-empty file path");
  }
  const result = readJsonCore(path);
  return result.ok ? result.value : null;
}
