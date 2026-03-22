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
const PASS_MESSAGE = "validateRuleEngineConfig enforces wake_win word refs for canonical words[] and legacy spells[] alias";

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

const legacyKnown = validateRuleEngineConfig(withSingleRule({
  id: "t_legacy_known",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, spells: [KNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
}));
if (hasWakeUnknownWordErrorV2(legacyKnown, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(CHECK_TAG, `validateRuleEngineConfig should accept legacy known wake spells[] alias refs: ${legacyKnown.join(" | ")}`);
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

const legacyUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_legacy_unknown",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, spells: [UNKNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
}));
if (!hasWakeUnknownWordErrorV2(legacyUnknown, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must reject unknown legacy wake spells[] refs: ${legacyUnknown.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
