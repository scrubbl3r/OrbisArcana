import { writeFileSync } from "node:fs";
import { stringifyJson } from "./stringify-json-v2.mjs";

export function writeJsonFile(path, value) {
  const filePath = typeof path === "string" ? path.trim() : "";
  if (!filePath) {
    throw new Error("writeJsonFile requires a non-empty file path");
  }
  writeFileSync(filePath, stringifyJson(value) + "\n", "utf8");
}
