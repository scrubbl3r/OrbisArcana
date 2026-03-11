import { failCheck } from "./check-fail-v2.mjs";

export function runOrFail(tag, fn) {
  try {
    return fn();
  } catch (err) {
    failCheck(tag, err?.message || String(err));
    return undefined;
  }
}
