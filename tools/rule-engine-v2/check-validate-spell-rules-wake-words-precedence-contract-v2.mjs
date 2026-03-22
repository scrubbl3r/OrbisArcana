import { validateSpellRules } from "../../src/content/spell-rules/validate-spell-rules.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import {
  KNOWN_WAKE_WORD_ID_V2,
  KNOWN_WAKE_WORD_SPELL_SELECTOR_V2,
  KNOWN_WAKE_WORD_WORD_SELECTOR_V2,
  UNKNOWN_WAKE_WORD_ID_V2,
  UNKNOWN_WAKE_WORD_SPELL_SELECTOR_V2,
  UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2,
} from "./wake-test-ids-v2.mjs";
import { hasWakeUnknownWordErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-words-precedence-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "validateSpellRules gives canonical wake_win.words[] precedence over legacy wake_win.spells[] alias when both are present";

const canonicalWinsRules = [
  {
    id: "t_wake_words_precedence_canonical_wins",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_WORD_SELECTOR_V2], spells: [UNKNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
  },
];
const canonicalWinsErrors = validateSpellRules(canonicalWinsRules);
if (hasWakeUnknownWordErrorV2(canonicalWinsErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules should prefer canonical wake_win.words[] over legacy spells[] alias when both exist: ${canonicalWinsErrors.join(" | ")}`
  );
}

const canonicalUnknownRules = [
  {
    id: "t_wake_words_precedence_canonical_unknown",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, words: [UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2], spells: [KNOWN_WAKE_WORD_SPELL_SELECTOR_V2] }],
  },
];
const canonicalUnknownErrors = validateSpellRules(canonicalUnknownRules);
if (!hasWakeUnknownWordErrorV2(canonicalUnknownErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules must continue validating canonical words[] when both words[] and spells[] are present: ${canonicalUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
