import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-validator-parser-parity-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator parser keeps asSelectorList-based tokenization for selector/window refs";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "asSelectorList,",
    "function parseStringOrArray(raw) {",
    "return asSelectorList(raw)",
    "function parseWindowRefs(raw) {",
    "return parseStringOrArray(raw).map((v) => asText(v)).filter(Boolean);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing validator parser-parity token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
