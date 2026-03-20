import { RULE_ENGINE_POLICY_CONTROL, validateRuleEngineConfig } from "../../src/content/spell-rules/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "validate-rule-engine-config-wake-words-precedence-contract:v2";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasError(errors, token) {
  return (Array.isArray(errors) ? errors : []).some((error) => String(error).includes(token));
}

function withSingleRule(rule) {
  const cfg = clone(RULE_ENGINE_POLICY_CONTROL);
  cfg.rules = [rule];
  return cfg;
}

const canonicalWins = validateRuleEngineConfig(withSingleRule({
  id: "t_wake_words_precedence_canonical_wins",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", words: ["word.rota"], spells: ["spell.__unknown_wake_word__"] }],
}));
if (hasError(canonicalWins, "wake_win references unknown word id: __unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig should prefer canonical wake_win.words[] over legacy spells[] alias when both exist: ${canonicalWins.join(" | ")}`
  );
}

const canonicalUnknown = validateRuleEngineConfig(withSingleRule({
  id: "t_wake_words_precedence_canonical_unknown",
  on: { all: [{ type: "word", id: "rota" }] },
  then: [{ type: "wake_win", words: ["word.__unknown_wake_word__"], spells: ["spell.rota"] }],
}));
if (!hasError(canonicalUnknown, "wake_win references unknown word id: __unknown_wake_word__")) {
  failCheck(
    CHECK_TAG,
    `validateRuleEngineConfig must keep validating canonical words[] when both words[] and spells[] are present: ${canonicalUnknown.join(" | ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateRuleEngineConfig gives canonical wake_win.words[] precedence over legacy wake_win.spells[] alias when both are present"
);
