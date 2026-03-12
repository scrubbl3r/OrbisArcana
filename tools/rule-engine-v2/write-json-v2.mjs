import { writeFileSync } from "node:fs";

export function writeJsonFile(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}
