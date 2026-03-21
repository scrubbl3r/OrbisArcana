import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-groups-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (groupNameRaw !== groupNameRaw.trim()) {",
    "errors.push(`${GROUPS_CONTEXT} key must not include leading/trailing whitespace: ${groupNameRaw}`);",
    "if (!Array.isArray(wordsRaw) || !wordsRaw.length) {",
    "errors.push(`${ctx} must be a non-empty array`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing groups shape validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves groups key whitespace and non-empty array validation"
);
