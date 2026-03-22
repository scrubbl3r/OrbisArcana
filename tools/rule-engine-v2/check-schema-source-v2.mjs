// Shared assertion helper for bootstrap/setRuleSchema source provenance checks.
import { failCheck } from "./check-fail-v2.mjs";
function assertNonEmptyString(value, tag, message) {
  if (typeof value !== "string" || !value.trim()) {
    failCheck(tag, message);
  }
}

export function assertSchemaSourceV2({
  tag,
  schema,
  expectedSource,
  label = "",
  missingSchemaMessage = "setRuleSchema was not called",
}) {
  assertNonEmptyString(tag, "schema-source:v2", "schema source assertion requires check tag");
  assertNonEmptyString(
    expectedSource,
    tag,
    "schema source assertion requires non-empty expectedSource"
  );
  if (label !== undefined && typeof label !== "string") {
    failCheck(tag, "schema source assertion label must be a string when provided");
  }
  assertNonEmptyString(
    missingSchemaMessage,
    tag,
    "schema source assertion requires non-empty missingSchemaMessage"
  );
  if (!schema || typeof schema !== "object") {
    failCheck(tag, missingSchemaMessage);
  }
  const actualSource = typeof schema.source === "string" ? schema.source : "";
  const labelPrefix = label ? `${label} ` : "";
  if (actualSource !== expectedSource) {
    failCheck(tag, `expected ${labelPrefix}source=${expectedSource}, got ${actualSource}`);
  }
}
