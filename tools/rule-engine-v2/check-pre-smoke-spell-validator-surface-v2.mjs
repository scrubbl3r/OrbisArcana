import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

// Ensures pre-smoke explicitly runs spell-runtime-routing and schema-integrity validators.
const CHECK_TAG = "pre-smoke-spell-validator-surface:v2";
const REL = "tools/rule-engine-v2/pre-smoke-check.mjs";
const PASS_MESSAGE = "pre-smoke runs spell-runtime-routing and spell-schema-integrity validators explicitly";
const text = readRelativeText(REL);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "validateSpellRuntimeRouting",
    "validateSpellSchemaIntegrity",
    "spell-runtime-routing validation failed",
    "spell-schema-integrity validation failed",
  ],
  missingMessage: (token) => `${REL} missing required pre-smoke validator token: ${token}`,
});

if (text.includes('failIfValidationErrors("interactions-v2 validation failed", interactionsErrors);') &&
    !text.includes('failIfValidationErrors("spell-runtime-routing validation failed"')) {
  failCheck(CHECK_TAG, `${REL} must run spell-runtime-routing validation in pre-smoke`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
