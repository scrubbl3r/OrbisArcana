import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-enabled-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(eventArgRaw, \"enabled\") && typeof eventArgRaw.enabled !== \"boolean\") {",
    "errors.push(`${ctx}.${eventIdRaw}.enabled must be boolean when present`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing trigger.enabled validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves trigger object enabled-type validation"
);
