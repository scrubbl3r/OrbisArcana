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

const CHECK_TAG = "validate-rule-engine-config-wake-words-precedence-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "validateRuleEngineConfig gives canonical wake_win.words[] precedence over legacy wake_win.spells[] alias when both are present";

function withSingleRule(rule) {
  const cfg = cloneJsonV2(RULE_ENGINE_POLICY_CONTROL);
  cfg.rules = [rule];
  return cfg;
}

const canonicalWins = validateRuleEngineConfig(withSingleRule({
  id: "t_wake_words_precedence_canonical_wins",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_WORD_SELECTOR_V2], spells: [UNKNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
}));
if (hasWakeUnknownWordErrorV2(canonicalWins, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig should prefer canonical wake_win.words[] over legacy spells[] alias when both exist: ${canonicalWins.join(" | ")}`
  );
}

const canonicalUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_wake_words_precedence_canonical_unknown",
  on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
  then: [{ type: ACTION_WAKE_WIN, words: [UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2], spells: [KNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
}));
if (!hasWakeUnknownWordErrorV2(canonicalUnknown, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must keep validating canonical words[] when both words[] and spells[] are present: ${canonicalUnknown.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
