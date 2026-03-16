import {
  requireTextExcludesTokensV2,
  requireTextIncludesTokensV2,
} from "./check-token-assertions-v2.mjs";

export function assertPolicyTokenContractV2({
  tag,
  rel,
  text,
  requiredTokens = [],
  forbiddenTokens = [],
  missingMessage,
  forbiddenMessage,
}) {
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
