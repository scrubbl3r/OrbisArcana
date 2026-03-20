import { validateSpellRules } from "../../src/content/spell-rules/validate-spell-rules.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-bare-id-contract:v2";
const UNKNOWN_WORD_ID = "__unknown_wake_word__";

function hasUnknownWakeWordError(errors, needle = UNKNOWN_WORD_ID) {
  return (Array.isArray(errors) ? errors : []).some((error) =>
    String(error).includes(`wake_win references unknown word id: ${needle}`)
  );
}

const canonicalBareRules = [
  {
    id: "t_wake_words_bare_canonical",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", words: ["rota"] }],
  },
];
const canonicalBareErrors = validateSpellRules(canonicalBareRules);
if (hasUnknownWakeWordError(canonicalBareErrors, "rota")) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules should accept bare wake_win.words[] refs: ${canonicalBareErrors.join(" | ")}`
  );
}

const legacyBareRules = [
  {
    id: "t_wake_words_bare_legacy_alias",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", spells: ["rota"] }],
  },
];
const legacyBareErrors = validateSpellRules(legacyBareRules);
if (hasUnknownWakeWordError(legacyBareErrors, "rota")) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules should accept bare wake_win.spells[] alias refs: ${legacyBareErrors.join(" | ")}`
  );
}

const unknownBareRules = [
  {
    id: "t_wake_words_unknown_bare",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", words: [UNKNOWN_WORD_ID] }],
  },
];
const unknownBareErrors = validateSpellRules(unknownBareRules);
if (!hasUnknownWakeWordError(unknownBareErrors, UNKNOWN_WORD_ID)) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules must reject unknown bare wake_win word refs: ${unknownBareErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateSpellRules accepts bare wake word ids for words[]/spells[] alias and rejects unknown bare ids"
);
