import { readFileSync } from "node:fs";

export function readJsonCore(path) {
  try {
    return Object.freeze({
      ok: true,
      value: JSON.parse(readFileSync(path, "utf8")),
      error: null,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      value: null,
      error,
    });
  }
}
