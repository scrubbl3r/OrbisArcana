import { validateSpellRules } from "../../src/content/spell-rules/validate-spell-rules.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-words-contract:v2";

function hasUnknownWakeWordError(errors, needle) {
  return (Array.isArray(errors) ? errors : []).some((error) =>
    String(error).includes(`wake_win references unknown word id: ${needle}`)
  );
}

const canonicalRules = [
  {
    id: "t_wake_words_canonical",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", words: ["word.rota"] }],
  },
];
const canonicalErrors = validateSpellRules(canonicalRules);
if (hasUnknownWakeWordError(canonicalErrors, "rota")) {
  failCheck(CHECK_TAG, `validateSpellRules should accept canonical wake_win.words[] refs: ${canonicalErrors.join(" | ")}`);
}

const legacyAliasRules = [
  {
    id: "t_wake_words_legacy_alias",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", spells: ["spell.rota"] }],
  },
];
const legacyAliasErrors = validateSpellRules(legacyAliasRules);
if (hasUnknownWakeWordError(legacyAliasErrors, "rota")) {
  failCheck(CHECK_TAG, `validateSpellRules should accept legacy wake_win.spells[] alias refs: ${legacyAliasErrors.join(" | ")}`);
}

const unknownWordRules = [
  {
    id: "t_wake_words_unknown",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", words: ["word.__unknown_wake_word__"] }],
  },
];
const unknownWordErrors = validateSpellRules(unknownWordRules);
if (!hasUnknownWakeWordError(unknownWordErrors, "__unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules must reject unknown wake_win word refs: ${unknownWordErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateSpellRules enforces wake_win word references with canonical words[] and legacy spells[] alias support"
);
