import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-empty-token-filter-source-surface:v2";
const BUILDER_REL = "src/content/interactions-v2/build-rule-engine-from-compiled-interaction-graph-v2.js";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 builder/validator sources preserve empty-token filtering in shared selector parsing";

const builderText = readRelativeText(BUILDER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: builderText,
  tokens: [
    "function parseStringOrArray(raw) {",
    "return asSelectorList(raw)",
    ".filter(Boolean);",
  ],
  missingMessage: (token) => `${BUILDER_REL} missing empty-token filter token: ${token}`,
});

const validatorText = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: validatorText,
  tokens: [
    "function parseStringOrArray(raw) {",
    "return asSelectorList(raw)",
    ".filter(Boolean);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing empty-token filter token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
