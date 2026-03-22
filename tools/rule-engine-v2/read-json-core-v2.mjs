// Low-level JSON reader returning {ok,value,error} without throwing to callers.
import { readFileSync } from "node:fs";
// Used by higher-level read helpers that map errors into check-specific failures.
// Returned objects are frozen to keep downstream checks functionally pure.
export function readJsonCore(path) {
  const filePath = typeof path === "string" ? path.trim() : "";
  if (!filePath) {
    throw new Error("readJsonCore requires a non-empty file path");
  }
  try {
    return Object.freeze({
      ok: true,
      value: JSON.parse(readFileSync(filePath, "utf8")),
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
