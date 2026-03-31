import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-open-spells-compat-entry-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "compiled-interaction-graph-v2 validator source preserves open.spells compat entry validation even when open.words is present";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(open, \"spells\")) {",
    "for (const rawValue of asSelectorList(open.spells)) {",
    "errors.push(`${ctx}.spells contains non-string word id: ${asText(rawValue) || \"(empty)\"}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing open.spells-compat-entry validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
