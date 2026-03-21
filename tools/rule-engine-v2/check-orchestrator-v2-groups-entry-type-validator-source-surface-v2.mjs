import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-groups-entry-type-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (typeof wordRaw !== \"string\") {",
    "errors.push(`${ctx} contains non-string word id: ${asText(wordRaw) || \"(empty)\"}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing groups-entry-type validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves non-string group entry rejection"
);
