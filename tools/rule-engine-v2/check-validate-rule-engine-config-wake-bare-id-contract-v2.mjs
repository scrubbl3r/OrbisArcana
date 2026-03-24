import { RULE_ENGINE_POLICY_CONTROL, validateRuleEngineConfig } from "../../src/content/spell-rules/index.js";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { hasWakeUnknownWordErrorV2 } from "./wake-error-matchers-v2.mjs";
import { KNOWN_WAKE_WORD_ID_V2, UNKNOWN_WAKE_WORD_ID_V2 } from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "validate-rule-engine-config-wake-bare-id-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "validateRuleEngineConfig accepts bare wake word ids for words[]/spells[] alias and rejects unknown bare ids";

function withSingleRule(rule) {
  const cfg = cloneJsonV2(RULE_ENGINE_POLICY_CONTROL);
  cfg.rules = [rule];
  return cfg;
}

const canonicalBareKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_bare_known",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_ID_V2] }],
}));
if (hasWakeUnknownWordErrorV2(canonicalBareKnown, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig should accept bare canonical wake words[] refs: ${canonicalBareKnown.join(" | ")}`
  );
}

const compatBareKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_compat_bare_known",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, spells: [KNOWN_WAKE_WORD_ID_V2] }],
}));
if (hasWakeUnknownWordErrorV2(compatBareKnown, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig should accept bare compat wake spells[] alias refs: ${compatBareKnown.join(" | ")}`
  );
}

const canonicalBareUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_bare_unknown",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, words: [UNKNOWN_WAKE_WORD_ID_V2] }],
}));
if (!hasWakeUnknownWordErrorV2(canonicalBareUnknown, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown bare canonical wake words[] refs: ${canonicalBareUnknown.join(" | ")}`
  );
}

const compatBareUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_compat_bare_unknown",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, spells: [UNKNOWN_WAKE_WORD_ID_V2] }],
}));
if (!hasWakeUnknownWordErrorV2(compatBareUnknown, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown bare compat wake spells[] refs: ${compatBareUnknown.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
