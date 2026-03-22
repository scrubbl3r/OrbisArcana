import { buildRuleEnginePreviewRuntime } from "../../src/content/spell-rules/build-rule-engine-preview-runtime.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "preview-runtime-word-condition-alias-contract:v2";
const SIGNAL_SPELL_ROTA = "spell.rota";
const SIGNAL_GESTURE_SPIN_Y = "gesture.spin_y";
const WORD_ROTA_BARE = "rota";
const WORD_ROTA_SELECTOR = "word.rota";
const CONDITION_TYPE_WORD = "word";
const CONDITION_TYPE_SPELL = "spell";
const EVENT_WORD_DETECTED = "voice.word_detected";
const EVENT_GESTURE_DETECTED = "gesture.detected";
const EFFECT_EVENT_TYPE = "event";
const EFFECT_EVENT_ID = "grace";
const RULE_WORD_PREFIX = "r_word_prefix";
const RULE_SPELL_PREFIX_ALIAS = "r_spell_prefix_alias";
const RULE_WORD_BARE_ALIAS = "r_word_bare_alias";
const RULE_SPELL_TYPE_ALIAS = "r_spell_type_alias";
const PASS_MESSAGE = "buildRuleEnginePreviewRuntime normalizes word/spell condition aliases to canonical spell.* signal ids";

const runtime = buildRuleEnginePreviewRuntime({
  signals: [
    { id: SIGNAL_SPELL_ROTA, sourceEvent: EVENT_WORD_DETECTED, enabled: true },
    { id: SIGNAL_GESTURE_SPIN_Y, sourceEvent: EVENT_GESTURE_DETECTED, enabled: true },
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
      id: RULE_SPELL_PREFIX_ALIAS,
      on: { all: [{ type: CONDITION_TYPE_WORD, id: SIGNAL_SPELL_ROTA }] },
      then: [{ type: EFFECT_EVENT_TYPE, id: EFFECT_EVENT_ID }],
    },
    {
      id: RULE_WORD_BARE_ALIAS,
      on: { all: [{ type: CONDITION_TYPE_WORD, id: WORD_ROTA_BARE }] },
      then: [{ type: EFFECT_EVENT_TYPE, id: EFFECT_EVENT_ID }],
    },
    {
      id: RULE_SPELL_TYPE_ALIAS,
      on: { all: [{ type: CONDITION_TYPE_SPELL, id: WORD_ROTA_BARE }] },
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

expectSignal(RULE_WORD_PREFIX, SIGNAL_SPELL_ROTA);
expectSignal(RULE_SPELL_PREFIX_ALIAS, SIGNAL_SPELL_ROTA);
expectSignal(RULE_WORD_BARE_ALIAS, SIGNAL_SPELL_ROTA);
expectSignal(RULE_SPELL_TYPE_ALIAS, SIGNAL_SPELL_ROTA);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
