import { failCheck } from "./check-fail-v2.mjs";

export function assertSingletonRegistryV2({ tag, values, label }) {
  if (!Array.isArray(values)) {
    failCheck(tag, `${label} must be an array`);
  }
  if (values.length !== 1) {
    failCheck(tag, `${label} must contain exactly one entry`);
  }
  const [entry] = values;
  if (typeof entry !== "string" || !entry.trim()) {
    failCheck(tag, `${label} singleton entry must be a non-empty string`);
  }
}
