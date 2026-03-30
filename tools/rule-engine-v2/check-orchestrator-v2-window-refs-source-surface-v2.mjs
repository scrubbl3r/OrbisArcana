import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-window-refs-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves requires/consume shared window-ref validation and unknown-window errors";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "validateWindowRefs(rule, ruleId, \"requires\", errors, pendingWindowRefs);",
    "validateWindowRefs(rule, ruleId, \"consume\", errors, pendingWindowRefs);",
    "if (!openWindowIds.has(ref.id)) {",
    "errors.push(`rule ${ref.ruleId} ${ref.key} references unknown window id: ${ref.id}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing window-ref validation token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
