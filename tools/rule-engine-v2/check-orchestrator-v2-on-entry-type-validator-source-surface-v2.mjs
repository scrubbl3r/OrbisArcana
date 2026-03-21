import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-on-entry-type-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const parseAndPush = (kind, raw) => {",
    "if (typeof rawValue !== \"string\") {",
    "errors.push(`${onContext}.${kind} contains non-string selector id: ${asText(rawValue) || \"(empty)\"}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing on-entry-type validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves non-string on selector entry rejection"
);
