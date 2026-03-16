import { readFileSync } from "node:fs";

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
