import { appendFileSync } from "node:fs";

export function appendJsonLine(path, value) {
  appendFileSync(path, JSON.stringify(value) + "\n", "utf8");
}
