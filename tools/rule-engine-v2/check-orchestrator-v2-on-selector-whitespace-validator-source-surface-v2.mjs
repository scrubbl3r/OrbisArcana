import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-on-selector-whitespace-validator-source-surface:v2";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const text = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: [
    "for (const key of [\"word\", \"gesture\", \"orb_state\"]) {",
    "if (typeof on[key] === \"string\" && on[key] !== on[key].trim()) {",
    "errors.push(`${onContext}.${key} contains selector id with leading/trailing whitespace: ${on[key]}`);",
    "if (typeof on.spell === \"string\" && on.spell !== on.spell.trim()) {",
    "errors.push(`${onContext}.spell contains selector id with leading/trailing whitespace: ${on.spell}`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing on-selector-whitespace validator token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 validator source preserves on selector whitespace validation for word/gesture/orb_state/spell"
);
