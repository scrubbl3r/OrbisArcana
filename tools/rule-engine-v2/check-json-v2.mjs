import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { failCheck } from "./check-fail-v2.mjs";

export function readJsonOrFail(tag, relPath) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), relPath), "utf8"));
  } catch (err) {
    failCheck(tag, `unable to read ${relPath} (${err?.message || err})`);
    return null;
  }
}
