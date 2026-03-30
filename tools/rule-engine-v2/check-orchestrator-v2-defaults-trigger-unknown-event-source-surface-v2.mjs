import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-defaults-trigger-unknown-event-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves defaults.trigger unknown-event validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const ctx = `${DEFAULTS_CONTEXT}.trigger`;",
    "if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {",
    "errors.push(`${ctx} references unknown event id: ${eventIdRaw}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing defaults.trigger unknown-event validation token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
