import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-open-tokenization-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder source preserves shared tokenized parsing for open.words/open.spells alias paths";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "function parseWordRefs(rawWords, groups) {",
    "const tokens = parseStringOrArray(rawWords);",
    "const wordsRaw = Object.hasOwn(open, FIELD_WORDS) ? open[FIELD_WORDS] : open[FIELD_SPELLS];",
    "const words = parseWordRefs(wordsRaw, groups);",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing open tokenization source token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
