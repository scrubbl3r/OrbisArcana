import { RULE_ENGINE_POLICY_CONTROL, validateRuleEngineConfig } from "../../src/content/spell-rules/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { cloneJsonV2 } from "./json-clone-v2.mjs";
import { hasWakeUnknownWordErrorV2 } from "./wake-error-matchers-v2.mjs";
import {
  KNOWN_WAKE_WORD_ID_V2,
  KNOWN_WAKE_WORD_SPELL_SELECTOR_V2,
  KNOWN_WAKE_WORD_WORD_SELECTOR_V2,
  UNKNOWN_WAKE_WORD_ID_V2,
  UNKNOWN_WAKE_WORD_SPELL_SELECTOR_V2,
  UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2,
} from "./wake-test-ids-v2.mjs";

const CHECK_TAG = "validate-rule-engine-config-wake-words-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "validateRuleEngineConfig enforces wake_win word refs for canonical words[] and compat spells[] alias";

function withSingleRule(rule) {
  const cfg = cloneJsonV2(RULE_ENGINE_POLICY_CONTROL);
  cfg.rules = [rule];
  return cfg;
}

const canonicalKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_known",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_WORD_SELECTOR_V2] }],
}));
if (hasWakeUnknownWordErrorV2(canonicalKnown, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(CHECK_TAG, `validateRuleEngineConfig should accept canonical known wake words[] refs: ${canonicalKnown.join(" | ")}`);
}

const compatKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_compat_known",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, spells: [KNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
}));
if (hasWakeUnknownWordErrorV2(compatKnown, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(CHECK_TAG, `validateRuleEngineConfig should accept compat wake spells[] alias refs: ${compatKnown.join(" | ")}`);
}

const canonicalUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_canonical_unknown",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, words: [UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2] }],
}));
if (!hasWakeUnknownWordErrorV2(canonicalUnknown, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown canonical wake words[] refs: ${canonicalUnknown.join(" | ")}`
  );
}

const compatUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_compat_unknown",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, spells: [UNKNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
}));
if (!hasWakeUnknownWordErrorV2(compatUnknown, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown compat wake spells[] refs: ${compatUnknown.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
