import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-open-selector-whitespace-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves open words/spells whitespace validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof open.words === \"string\" && open.words !== open.words.trim()) {",
    "errors.push(`${ctx}.words contains word id with leading/trailing whitespace: ${open.words}`);",
    "if (Array.isArray(open.words)) {",
    "errors.push(`${ctx}.words contains word id with leading/trailing whitespace: ${rawEntry}`);",
    "if (typeof open.spells === \"string\" && open.spells !== open.spells.trim()) {",
    "errors.push(`${ctx}.spells contains word id with leading/trailing whitespace: ${open.spells}`);",
    "if (Array.isArray(open.spells)) {",
    "errors.push(`${ctx}.spells contains word id with leading/trailing whitespace: ${rawEntry}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open-selector-whitespace validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
