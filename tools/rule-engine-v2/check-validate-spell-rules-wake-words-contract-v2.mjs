import { validateSpellRules } from "../../src/content/spell-rules/validate-spell-rules.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  KNOWN_WAKE_WORD_ID_V2,
  KNOWN_WAKE_WORD_SPELL_SELECTOR_V2,
  KNOWN_WAKE_WORD_WORD_SELECTOR_V2,
  UNKNOWN_WAKE_WORD_ID_V2,
  UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2,
} from "./wake-test-ids-v2.mjs";
import { hasWakeUnknownWordErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-words-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "validateSpellRules enforces wake_win word references with canonical words[] and legacy spells[] alias support";

const canonicalRules = [
  {
    id: "t_wake_words_canonical",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_WORD_SELECTOR_V2] }],
  },
];
const canonicalErrors = validateSpellRules(canonicalRules);
if (hasWakeUnknownWordErrorV2(canonicalErrors, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(CHECK_TAG, `validateSpellRules should accept canonical wake_win.words[] refs: ${canonicalErrors.join(" | ")}`);
}

const legacyAliasRules = [
  {
    id: "t_wake_words_legacy_alias",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, spells: [KNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
  },
];
const legacyAliasErrors = validateSpellRules(legacyAliasRules);
if (hasWakeUnknownWordErrorV2(legacyAliasErrors, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(CHECK_TAG, `validateSpellRules should accept legacy wake_win.spells[] alias refs: ${legacyAliasErrors.join(" | ")}`);
}

const unknownWordRules = [
  {
    id: "t_wake_words_unknown",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, words: [UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2] }],
  },
];
const unknownWordErrors = validateSpellRules(unknownWordRules);
if (!hasWakeUnknownWordErrorV2(unknownWordErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules must reject unknown wake_win word refs: ${unknownWordErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
