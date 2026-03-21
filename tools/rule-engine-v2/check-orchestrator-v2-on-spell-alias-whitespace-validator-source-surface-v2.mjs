import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-on-spell-alias-whitespace-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Array.isArray(on.spell)) {",
    "if (typeof rawEntry === \"string\" && rawEntry !== rawEntry.trim()) {",
    "errors.push(`${onContext}.spell contains selector id with leading/trailing whitespace: ${rawEntry}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing on.spell-alias-whitespace validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves on.spell alias whitespace validation when on.word is present"
);
