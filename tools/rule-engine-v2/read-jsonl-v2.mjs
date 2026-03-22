// Reads JSONL and returns only successfully parsed non-empty records.
import { readFileSync } from "node:fs";
// Used by milestone/history readers that tolerate malformed historical lines.
// Missing files are treated as empty history for resilient check pipelines.
export function readJsonLines(path) {
  const filePath = typeof path === "string" ? path.trim() : "";
  if (!filePath) {
    throw new Error("readJsonLines requires a non-empty file path");
  }
  let text = "";
  try {
    text = readFileSync(filePath, "utf8");
  } catch (_) {
    return [];
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}
