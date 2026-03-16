import { failCheck } from "./check-fail-v2.mjs";

export function requireTextIncludesTokensV2({ tag, text, tokens, missingMessage }) {
  for (const token of tokens) {
    if (!text.includes(token)) {
      failCheck(tag, missingMessage(token));
    }
  }
}

export function requireTextExcludesTokensV2({ tag, text, tokens, forbiddenMessage }) {
  for (const token of tokens) {
    if (text.includes(token)) {
      failCheck(tag, forbiddenMessage(token));
    }
  }
}
