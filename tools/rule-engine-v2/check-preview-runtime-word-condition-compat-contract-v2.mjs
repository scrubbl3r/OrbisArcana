import { buildRuleEnginePreviewRuntime } from "../../src/content/spell-rules/build-rule-engine-preview-runtime.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "preview-runtime-word-condition-compat-contract:v2";
const SIGNAL_RUNTIME_ROTA = "spell.rota";
const WORD_ROTA_BARE = "rota";
const WORD_ROTA_SELECTOR = "word.rota";
const CONDITION_TYPE_WORD = "word";
const EVENT_WORD_DETECTED = "voice.word_detected";
const EFFECT_EVENT_TYPE = "event";
const EFFECT_EVENT_ID = "grace";
const RULE_WORD_PREFIX = "r_word_prefix";
const RULE_WORD_SIGNAL_PREFIX = "r_word_signal_prefix";
const RULE_WORD_BARE = "r_word_bare";
const PASS_MESSAGE = "buildRuleEnginePreviewRuntime normalizes canonical word conditions to runtime signal ids";

const runtime = buildRuleEnginePreviewRuntime({
  signals: [
    { id: SIGNAL_RUNTIME_ROTA, sourceEvent: EVENT_WORD_DETECTED, enabled: true },
  ],
  windows: [],
  events: [],
  rules: [
    {
      id: RULE_WORD_PREFIX,
      on: { all: [{ type: CONDITION_TYPE_WORD, id: WORD_ROTA_SELECTOR }] },
      then: [{ type: EFFECT_EVENT_TYPE, id: EFFECT_EVENT_ID }],
    },
    {
      id: RULE_WORD_SIGNAL_PREFIX,
      on: { all: [{ type: CONDITION_TYPE_WORD, id: SIGNAL_RUNTIME_ROTA }] },
      then: [{ type: EFFECT_EVENT_TYPE, id: EFFECT_EVENT_ID }],
    },
    {
      id: RULE_WORD_BARE,
      on: { all: [{ type: CONDITION_TYPE_WORD, id: WORD_ROTA_BARE }] },
      then: [{ type: EFFECT_EVENT_TYPE, id: EFFECT_EVENT_ID }],
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

expectSignal(RULE_WORD_PREFIX, SIGNAL_RUNTIME_ROTA);
expectSignal(RULE_WORD_SIGNAL_PREFIX, SIGNAL_RUNTIME_ROTA);
expectSignal(RULE_WORD_BARE, SIGNAL_RUNTIME_ROTA);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
