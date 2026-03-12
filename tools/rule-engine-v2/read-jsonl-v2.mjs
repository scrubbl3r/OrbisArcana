import { readFileSync } from "node:fs";

export function readJsonLines(path) {
  let text = "";
  try {
    text = readFileSync(path, "utf8");
  } catch (_) {
    return [];
  }

  return String(text || "")
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
