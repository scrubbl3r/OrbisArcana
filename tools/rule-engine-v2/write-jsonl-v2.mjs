import { appendFileSync } from "node:fs";

export function appendJsonLine(path, value) {
  const filePath = typeof path === "string" ? path.trim() : "";
  if (!filePath) {
    throw new Error("appendJsonLine requires a non-empty file path");
  }
  appendFileSync(filePath, JSON.stringify(value) + "\n", "utf8");
}
