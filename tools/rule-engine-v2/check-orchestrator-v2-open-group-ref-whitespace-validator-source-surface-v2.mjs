import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-open-group-ref-whitespace-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves explicit whitespace rejection for open.words @group refs";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const groupNameRaw = trimmed.slice(1);",
    "if (groupNameRaw !== groupNameRaw.trim()) {",
    "errors.push(`rule ${ruleId} open.words group ref must not include leading/trailing whitespace after @: ${trimmed}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open-group-ref-whitespace validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
