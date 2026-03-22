import { validateSpellRules } from "../../src/content/spell-rules/validate-spell-rules.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { KNOWN_WAKE_WORD_ID_V2, UNKNOWN_WAKE_WORD_ID_V2 } from "./wake-test-ids-v2.mjs";
import { hasWakeUnknownWordErrorV2 } from "./wake-error-matchers-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-bare-id-contract:v2";
const ACTION_WAKE_WIN = "wake_win";
const PASS_MESSAGE = "validateSpellRules accepts bare wake word ids for words[]/spells[] alias and rejects unknown bare ids";

const canonicalBareRules = [
  {
    id: "t_wake_words_bare_canonical",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, words: [KNOWN_WAKE_WORD_ID_V2] }],
  },
];
const canonicalBareErrors = validateSpellRules(canonicalBareRules);
if (hasWakeUnknownWordErrorV2(canonicalBareErrors, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules should accept bare wake_win.words[] refs: ${canonicalBareErrors.join(" | ")}`
  );
}

const legacyBareRules = [
  {
    id: "t_wake_words_bare_legacy_alias",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, spells: [KNOWN_WAKE_WORD_ID_V2] }],
  },
];
const legacyBareErrors = validateSpellRules(legacyBareRules);
if (hasWakeUnknownWordErrorV2(legacyBareErrors, KNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules should accept bare wake_win.spells[] alias refs: ${legacyBareErrors.join(" | ")}`
  );
}

const unknownBareRules = [
  {
    id: "t_wake_words_unknown_bare",
    on: { all: [{ type: "word", id: KNOWN_WAKE_WORD_ID_V2 }] },
    then: [{ type: ACTION_WAKE_WIN, words: [UNKNOWN_WAKE_WORD_ID_V2] }],
  },
];
const unknownBareErrors = validateSpellRules(unknownBareRules);
if (!hasWakeUnknownWordErrorV2(unknownBareErrors, UNKNOWN_WAKE_WORD_ID_V2)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules must reject unknown bare wake_win word refs: ${unknownBareErrors.join(" | ")}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
