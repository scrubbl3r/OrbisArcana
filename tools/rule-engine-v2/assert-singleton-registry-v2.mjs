import { failCheck } from "./check-fail-v2.mjs";

export function assertSingletonRegistryV2({ tag, values, label }) {
  if (!tag) {
    failCheck("assert-singleton-registry:v2", "singleton registry assertion requires check tag");
  }
  if (!label) {
    failCheck(tag, "singleton registry assertion requires label");
  }
  if (!values) {
    failCheck(tag, `${label} assertion requires values`);
  }
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
