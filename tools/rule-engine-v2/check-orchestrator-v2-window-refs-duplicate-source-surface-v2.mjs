import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-window-refs-duplicate-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "function validateWindowRefs(rule, ruleId, key, errors, pendingRefs) {",
    "const seen = new Set();",
    "pushDuplicateWhenSeen(errors, seen, id, `rule ${ruleId} ${key} contains duplicate window id: ${id}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing window-ref duplicate detection token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves duplicate window-ref detection in validateWindowRefs"
);
