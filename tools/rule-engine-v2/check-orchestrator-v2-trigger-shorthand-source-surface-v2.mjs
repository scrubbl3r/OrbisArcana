import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-shorthand-source-surface:v2";
const COMPILER_REL = "src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";

const compilerText = readRelativeText(COMPILER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: compilerText,
  tokens: [
    "if (typeof triggerRaw === \"string\" || Array.isArray(triggerRaw)) {",
    "return mapDefined(parseStringOrArray(triggerRaw), (rawEventId) => {",
    "const eventId = normalizeEventId(rawEventId);",
  ],
  missingMessage: (token) => `${COMPILER_REL} missing trigger shorthand-compile token: ${token}`,
});

const validatorText = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: validatorText,
  tokens: [
    "if (typeof trigger === \"string\" || Array.isArray(trigger)) {",
    "const eventIds = parseStringOrArray(trigger);",
    "errors.push(`${ctx} shorthand must contain at least one event id`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing trigger shorthand-validation token: ${token}`,
});

reportCheckPass(
  CHECK_TAG,
  "orchestrator-v2 compiler/validator sources preserve trigger shorthand string/array handling"
);
