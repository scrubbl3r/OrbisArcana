import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-top-level-optional-object-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves top-level defaults/groups object-type validation when present";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(cfg, \"defaults\") && !isPlainObject(cfg.defaults)) {",
    "errors.push(`${ROOT_CONTEXT}.defaults must be an object when present`);",
    "if (Object.hasOwn(cfg, \"groups\") && !isPlainObject(cfg.groups)) {",
    "errors.push(`${ROOT_CONTEXT}.groups must be an object when present`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing top-level optional-object validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
