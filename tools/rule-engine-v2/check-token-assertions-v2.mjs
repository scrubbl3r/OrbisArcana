import { failCheck } from "./check-fail-v2.mjs";

function assertTokenAssertionInputsV2({ tag, text, tokens, messageFn, mode }) {
  if (!tag) {
    failCheck("token-assertions:v2", `${mode} token assertion requires check tag`);
  }
  if (typeof text !== "string") {
    failCheck(tag, `${mode} token assertion text must be a string`);
  }
  if (!Array.isArray(tokens)) {
    failCheck(tag, `${mode} token assertion tokens must be an array`);
  }
  if (typeof messageFn !== "function") {
    failCheck(tag, `${mode} token assertion message callback must be a function`);
  }
  for (const [index, token] of tokens.entries()) {
    if (typeof token !== "string") {
      failCheck(tag, `${mode} token assertion token[${index}] must be a string`);
    }
    if (!token.trim()) {
      failCheck(tag, `${mode} token assertion token[${index}] must be non-empty`);
    }
  }
}

export function requireTextIncludesTokensV2({ tag, text, tokens, missingMessage }) {
  assertTokenAssertionInputsV2({
    tag,
    text,
    tokens,
    messageFn: missingMessage,
    mode: "include",
  });
  for (const token of tokens) {
    if (!text.includes(token)) {
      failCheck(tag, missingMessage(token));
    }
  }
}

export function requireTextExcludesTokensV2({ tag, text, tokens, forbiddenMessage }) {
  assertTokenAssertionInputsV2({
    tag,
    text,
    tokens,
    messageFn: forbiddenMessage,
    mode: "exclude",
  });
  for (const token of tokens) {
    if (text.includes(token)) {
      failCheck(tag, forbiddenMessage(token));
    }
  }
}
