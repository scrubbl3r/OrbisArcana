import { readJsonCore } from "./read-json-core-v2.mjs";

export function readJsonSafe(path) {
  const result = readJsonCore(path);
  return result.ok ? result.value : null;
}
