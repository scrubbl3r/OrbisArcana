import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-on-shape-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-compiled-interaction-graph-v2.js";
const PASS_MESSAGE = "orchestrator-v2 validator source preserves on selector field type-shape validation";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "if (Object.hasOwn(on, \"word\") && !isStringOrArray(on.word)) {",
    "errors.push(`${onContext}.word must be a string or array when present`);",
    "if (Object.hasOwn(on, \"spell\") && !isStringOrArray(on.spell)) {",
    "errors.push(`${onContext}.spell must be a string or array when present`);",
    "if (Object.hasOwn(on, \"spin\") && !isStringOrArray(on.spin)) {",
    "errors.push(`${onContext}.spin must be a string or array when present`);",
    "if (Object.hasOwn(on, \"shake\") && !isStringOrArray(on.shake)) {",
    "errors.push(`${onContext}.shake must be a string or array when present`);",
    "if (Object.hasOwn(on, \"orb_state\") && !isStringOrArray(on.orb_state)) {",
    "errors.push(`${onContext}.orb_state must be a string or array when present`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing on-shape validator token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
