// Writes stable pretty-JSON plus trailing newline.
import { writeFileSync } from "node:fs";
import { stringifyJson } from "./stringify-json-v2.mjs";
// Central writer for generated artifacts to enforce newline + formatting consistency.
// Callers provide absolute or cwd-relative paths; writer does not remap paths.
export function writeJsonFile(path, value) {
  const filePath = typeof path === "string" ? path.trim() : "";
  if (!filePath) {
    throw new Error("writeJsonFile requires a non-empty file path");
  }
  writeFileSync(filePath, stringifyJson(value) + "\n", "utf8");
}
