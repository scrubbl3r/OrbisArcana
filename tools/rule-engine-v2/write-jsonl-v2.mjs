// Appends one JSON-serialized record as a newline-delimited JSONL line.
import { appendFileSync } from "node:fs";
// Shared append helper for milestone/history artifact pipelines.
// Deliberately no pretty formatting to preserve one-record-per-line semantics.
export function appendJsonLine(path, value) {
  const filePath = typeof path === "string" ? path.trim() : "";
  if (!filePath) {
    throw new Error("appendJsonLine requires a non-empty file path");
  }
  appendFileSync(filePath, JSON.stringify(value) + "\n", "utf8");
}
