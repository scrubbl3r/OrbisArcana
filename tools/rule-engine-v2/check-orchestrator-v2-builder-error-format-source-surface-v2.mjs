import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-builder-error-format-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder source preserves validation error prefix + joined-delimiter formatting";

const text = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "const ORCHESTRATOR_V2_VALIDATION_ERROR_PREFIX = \"ORCHESTRATOR_V2 validation failed: \";",
    "const VALIDATION_ERROR_DELIMITER = \" | \";",
    "if (!result || result.ok !== true) {",
    "throw new Error(",
    "`${ORCHESTRATOR_V2_VALIDATION_ERROR_PREFIX}${asArray(result && result.errors).join(VALIDATION_ERROR_DELIMITER)}`",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing builder validation-error-format token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
