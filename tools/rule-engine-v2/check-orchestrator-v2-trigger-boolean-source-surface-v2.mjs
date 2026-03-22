import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";

const CHECK_TAG = "orchestrator-v2-trigger-boolean-source-surface:v2";
const COMPILER_REL = "src/content/interactions-v2/build-rule-engine-from-orchestrator-v2.js";
const VALIDATOR_REL = "src/content/interactions-v2/validate-orchestrator-v2.js";
const PASS_MESSAGE = "orchestrator-v2 compiler/validator sources preserve trigger boolean handling (false -> enabled:false)";

const compilerText = readRelativeText(COMPILER_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: compilerText,
  tokens: [
    "if (typeof argRaw === \"boolean\") {",
    "if (argRaw === false) out[FIELD_ENABLED] = false;",
    "return Object.freeze(out);",
  ],
  missingMessage: (token) => `${COMPILER_REL} missing trigger boolean-compile token: ${token}`,
});

const validatorText = readRelativeText(VALIDATOR_REL);
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text: validatorText,
  tokens: [
    "if (typeof eventArgRaw === \"boolean\") continue;",
    "if (!isPlainObject(eventArgRaw)) {",
    "errors.push(`${ctx}.${eventIdRaw} must be boolean or object args`);",
  ],
  missingMessage: (token) => `${VALIDATOR_REL} missing trigger boolean-validation token: ${token}`,
});

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
