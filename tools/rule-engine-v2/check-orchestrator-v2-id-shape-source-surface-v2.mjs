import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-id-shape-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves ID-shape checks for rule/open/window ids and duplicate open.id guard";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (!ID_RE.test(ruleId)) {",
    "errors.push(`${ROOT_CONTEXT}.rules[] id has invalid shape: ${ruleId}`);",
    "if (!ID_RE.test(openId)) {",
    "errors.push(`${ctx}.id has invalid shape: ${openId}`);",
    "if (!ID_RE.test(id)) {",
    "errors.push(`rule ${ruleId} ${key} has invalid window id shape: ${id}`);",
    "errors.push(`${ctx}.id duplicates previously opened window: ${openId}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing id-shape validation token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
