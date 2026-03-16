import { assertPolicyTokenContractV2 } from "./check-policy-token-contract-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

export function assertPolicyTokenContractAcrossTargetsV2({
  tag,
  targets,
  label,
  requiredTokens = [],
  forbiddenTokens = [],
  missingMessage,
  forbiddenMessage,
}) {
  if (!tag) {
    failCheck(
      "policy-targets-token-contract:v2",
      "policy token contract target assertion requires check tag"
    );
  }
  if (!label) {
    failCheck(tag, "policy token contract target assertion requires label");
  }
  if (!targets) {
    failCheck(tag, "policy token contract target assertion requires targets");
  }
  if (!Array.isArray(targets) || !targets.length) {
    failCheck(tag, "policy token contract targets must be a non-empty array");
  }
  if (!Array.isArray(requiredTokens)) {
    failCheck(tag, "policy token contract requiredTokens must be an array");
  }
  if (!Array.isArray(forbiddenTokens)) {
    failCheck(tag, "policy token contract forbiddenTokens must be an array");
  }
  if (missingMessage != null && typeof missingMessage !== "function") {
    failCheck(tag, "policy token contract missingMessage must be a function");
  }
  if (forbiddenMessage != null && typeof forbiddenMessage !== "function") {
    failCheck(tag, "policy token contract forbiddenMessage must be a function");
  }
  for (const [index, rel] of targets.entries()) {
    if (typeof rel !== "string") {
      failCheck(tag, `${label}[${index}] path must be a string`);
    }
    if (!rel.trim()) {
      failCheck(tag, `${label}[${index}] path is empty`);
    }
    const text = readRelativeText(rel);
    assertPolicyTokenContractV2({
      tag,
      rel,
      text,
      requiredTokens,
      forbiddenTokens,
      missingMessage: missingMessage
        ? (token) => missingMessage(token, rel)
        : undefined,
      forbiddenMessage: forbiddenMessage
        ? (token) => forbiddenMessage(token, rel)
        : undefined,
    });
  }
}
