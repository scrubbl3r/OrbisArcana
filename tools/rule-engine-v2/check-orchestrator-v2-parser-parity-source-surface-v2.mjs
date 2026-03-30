import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-parser-parity-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder parser uses asSelectorList parity for comma-tokenized strings and arrays";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "asSelectorList,",
    "function parseStringOrArray(raw) {",
    "return asSelectorList(raw)",
    ".map((v) => asText(v))",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing parser-parity token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
