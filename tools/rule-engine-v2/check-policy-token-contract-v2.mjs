import { failCheck } from "./check-fail-v2.mjs";
import { requireTextExcludesTokensV2, requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

export function assertPolicyTokenContractV2({
  tag,
  rel,
  text,
  requiredTokens = [],
  forbiddenTokens = [],
  missingMessage,
  forbiddenMessage,
}) {
  if (!tag) {
    failCheck("policy-token-contract:v2", "policy token contract requires check tag");
  }
  if (typeof rel !== "string" || !rel.trim()) {
    failCheck(tag, "policy token contract requires a non-empty rel path");
  }
  if (typeof text !== "string") {
    failCheck(tag, `policy token contract text must be a string: ${rel}`);
  }
  if (!Array.isArray(requiredTokens)) {
    failCheck(tag, `policy token contract requiredTokens must be an array: ${rel}`);
  }
  if (!Array.isArray(forbiddenTokens)) {
    failCheck(tag, `policy token contract forbiddenTokens must be an array: ${rel}`);
  }
  if (missingMessage != null && typeof missingMessage !== "function") {
    failCheck(tag, `policy token contract missingMessage must be a function: ${rel}`);
  }
  if (forbiddenMessage != null && typeof forbiddenMessage !== "function") {
    failCheck(tag, `policy token contract forbiddenMessage must be a function: ${rel}`);
  }
  if (requiredTokens.length) {
    requireTextIncludesTokensV2({
      tag,
      text,
      tokens: requiredTokens,
      missingMessage:
        missingMessage || ((token) => `${rel} must reference ${token}`),
    });
  }

  if (forbiddenTokens.length) {
    requireTextExcludesTokensV2({
      tag,
      text,
      tokens: forbiddenTokens,
      forbiddenMessage:
        forbiddenMessage || ((token) => `${rel} must not reference ${token}`),
    });
  }
}
