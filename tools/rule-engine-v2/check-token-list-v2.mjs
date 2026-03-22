// Shared token-list guards for manifest/docs-index contract assertions.
import { failCheck } from "./check-fail-v2.mjs";
// Keeps token-list validation semantics centralized for multiple doc/surface checks.
// Helpers fail fast to keep caller diagnostics short and deterministic.
function assertOptionsObjectV2(options, helperTag, helperLabel) {
  if (!options || typeof options !== "object") {
    failCheck(helperTag, `${helperLabel} requires options object`);
  }
}

function assertTokenListInputsV2({ tag, tokens, emptyMessage, invalidMessage }, helperLabel) {
  if (!tag || typeof tag !== "string") {
    failCheck("token-list:v2", "token list assertion requires check tag");
  }
  if (typeof emptyMessage !== "string" || !emptyMessage.trim()) {
    failCheck(tag, `${helperLabel} requires non-empty emptyMessage`);
  }
  if (typeof invalidMessage !== "string" || !invalidMessage.trim()) {
    failCheck(tag, `${helperLabel} requires non-empty invalidMessage`);
  }
  if (!Array.isArray(tokens)) {
    failCheck(tag, `${helperLabel} tokens must be an array`);
  }
}

export function requireTokenListV2(options) {
  assertOptionsObjectV2(options, "token-list:v2", "requireTokenListV2");
  const { tag, tokens, emptyMessage, invalidMessage } = options;
  assertTokenListInputsV2({
    tag,
    tokens,
    emptyMessage,
    invalidMessage,
  }, "requireTokenListV2");
  if (!tokens.length) {
    failCheck(tag, emptyMessage);
  }
  for (const token of tokens) {
    if (typeof token !== "string" || !token.trim()) {
      failCheck(tag, invalidMessage);
    }
  }
}

export function requireSingleTokenV2(options) {
  assertOptionsObjectV2(options, "token-list:v2", "requireSingleTokenV2");
  const { tag, tokens, emptyMessage, invalidMessage } = options;
  requireTokenListV2({
    tag,
    tokens,
    emptyMessage,
    invalidMessage,
  });
  if (tokens.length !== 1) {
    failCheck(tag, invalidMessage);
  }
  return tokens[0];
}
