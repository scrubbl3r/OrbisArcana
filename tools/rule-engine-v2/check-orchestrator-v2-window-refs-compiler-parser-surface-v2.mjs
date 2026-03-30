import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-window-refs-compiler-parser-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder source preserves shared parseStringOrArray tokenization for requires/consume refs";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const requires = parseStringOrArray(rule[FIELD_REQUIRES]);",
    "if (requires.length) out[FIELD_REQUIRES] = Object.freeze(requires);",
    "const consume = parseStringOrArray(rule[FIELD_CONSUME]);",
    "if (consume.length) out[FIELD_CONSUME] = Object.freeze(consume);",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing window-ref compiler parser token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
