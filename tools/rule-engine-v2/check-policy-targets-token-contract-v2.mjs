import { assertPolicyTokenContractV2 } from "./check-policy-token-contract-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

export function assertPolicyTokenContractAcrossTargetsV2({
  tag,
  targets,
  label = "policy token contract target",
  requiredTokens = [],
  forbiddenTokens = [],
  missingMessage,
  forbiddenMessage,
}) {
  if (!Array.isArray(targets) || !targets.length) {
    failCheck(tag, "policy token contract targets must be a non-empty array");
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
