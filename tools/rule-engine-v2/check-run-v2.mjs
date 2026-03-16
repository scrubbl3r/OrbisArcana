import { failCheck } from "./check-fail-v2.mjs";

export function runOrFail(tag, fn) {
  const safeTag = typeof tag === "string" ? tag.trim() : "";
  if (!safeTag) {
    failCheck("run-or-fail:v2", "runOrFail requires a non-empty string tag");
  }
  if (typeof fn !== "function") {
    failCheck(safeTag, "runOrFail requires fn to be a function");
  }
  try {
    return fn();
  } catch (err) {
    const msg = err instanceof Error && typeof err.message === "string" && err.message
      ? err.message
      : "unknown error";
    failCheck(safeTag, msg);
    return undefined;
  }
}
