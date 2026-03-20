import { buildRuleEnginePreviewRuntime } from "../../src/content/spell-rules/build-rule-engine-preview-runtime.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "preview-runtime-word-condition-alias-contract:v2";

const runtime = buildRuleEnginePreviewRuntime({
  signals: [
    { id: "spell.rota", sourceEvent: "voice.word_detected", enabled: true },
    { id: "gesture.spin_y", sourceEvent: "gesture.detected", enabled: true },
  ],
  windows: [],
  events: [],
  rules: [
    {
      id: "r_word_prefix",
      on: { all: [{ type: "word", id: "word.rota" }] },
      then: [{ type: "event", id: "grace" }],
    },
    {
      id: "r_spell_prefix_alias",
      on: { all: [{ type: "word", id: "spell.rota" }] },
      then: [{ type: "event", id: "grace" }],
    },
    {
      id: "r_word_bare_alias",
      on: { all: [{ type: "word", id: "rota" }] },
      then: [{ type: "event", id: "grace" }],
    },
    {
      id: "r_spell_type_alias",
      on: { all: [{ type: "spell", id: "rota" }] },
      then: [{ type: "event", id: "grace" }],
    },
  ],
});

const rules = Array.isArray(runtime?.rules) ? runtime.rules : [];
function expectSignal(ruleId, expectedSignalId) {
  const rule = rules.find((item) => item?.id === ruleId);
  if (!rule) failCheck(CHECK_TAG, `missing normalized rule: ${ruleId}`);
  const signalIds = Array.isArray(rule.signalIds) ? rule.signalIds : [];
  if (signalIds.length !== 1 || signalIds[0] !== expectedSignalId) {
    failCheck(
      CHECK_TAG,
      `rule ${ruleId} should normalize to signal ${expectedSignalId}; got ${JSON.stringify(signalIds)}`
    );
  }
}

expectSignal("r_word_prefix", "spell.rota");
expectSignal("r_spell_prefix_alias", "spell.rota");
expectSignal("r_word_bare_alias", "spell.rota");
expectSignal("r_spell_type_alias", "spell.rota");

reportCheckPass(
  CHECK_TAG,
  "buildRuleEnginePreviewRuntime normalizes word/spell condition aliases to canonical spell.* signal ids"
);
