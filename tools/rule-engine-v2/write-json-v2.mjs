import { writeFileSync } from "node:fs";
import { stringifyJson } from "./stringify-json-v2.mjs";

export function writeJsonFile(path, value) {
  writeFileSync(path, stringifyJson(value) + "\n", "utf8");
}
