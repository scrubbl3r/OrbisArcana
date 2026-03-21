import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-on-spell-alias-entry-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(on, \"spell\")) {",
    "for (const rawValue of asSelectorList(on.spell)) {",
    "errors.push(`${onContext}.spell contains non-string selector id: ${asText(rawValue) || \"(empty)\"}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing on.spell-alias-entry validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves on.spell alias entry validation even when on.word is present"
);
