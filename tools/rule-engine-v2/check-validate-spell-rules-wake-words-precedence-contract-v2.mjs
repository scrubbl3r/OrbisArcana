import { validateSpellRules } from "../../src/content/spell-rules/validate-spell-rules.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "validate-spell-rules-wake-words-precedence-contract:v2";

function hasUnknownWakeWordError(errors, needle) {
  return (Array.isArray(errors) ? errors : []).some((error) =>
    String(error).includes(`wake_win references unknown word id: ${needle}`)
  );
}

const canonicalWinsRules = [
  {
    id: "t_wake_words_precedence_canonical_wins",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", words: ["word.rota"], spells: ["spell.__unknown_wake_word__"] }],
  },
];
const canonicalWinsErrors = validateSpellRules(canonicalWinsRules);
if (hasUnknownWakeWordError(canonicalWinsErrors, "__unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules should prefer canonical wake_win.words[] over legacy spells[] alias when both exist: ${canonicalWinsErrors.join(" | ")}`
  );
}

const canonicalUnknownRules = [
  {
    id: "t_wake_words_precedence_canonical_unknown",
    on: { all: [{ type: "word", id: "rota" }] },
    then: [{ type: "wake_win", words: ["word.__unknown_wake_word__"], spells: ["spell.rota"] }],
  },
];
const canonicalUnknownErrors = validateSpellRules(canonicalUnknownRules);
if (!hasUnknownWakeWordError(canonicalUnknownErrors, "__unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateSpellRules must continue validating canonical words[] when both words[] and spells[] are present: ${canonicalUnknownErrors.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateSpellRules gives canonical wake_win.words[] precedence over legacy wake_win.spells[] alias when both are present"
);
