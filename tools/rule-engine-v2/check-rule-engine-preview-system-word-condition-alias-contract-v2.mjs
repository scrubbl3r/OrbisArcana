import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "rule-engine-preview-system-word-condition-alias-contract:v2";
const EVT_PREVIEW_MATCHED = "rule_engine.preview_matched";
const EVT_WORD_DETECTED = "voice.word_detected";
const WORD_ID_ROTA = "rota";
const SIGNAL_ID_SPELL_ROTA = "spell.rota";
const CONDITION_TYPE_WORD = "word";
const CONDITION_TYPE_SPELL = "spell";
const CONDITION_WORD_ID_PATH = "word.id";
const EFFECT_TYPE_EVENT = "event";
const EFFECT_ID_GRACE = "grace";
const RULE_WORD_PREFIX = "r_word_prefix";
const RULE_WORD_SPELL_PREFIX = "r_word_spell_prefix";
const RULE_WORD_BARE = "r_word_bare";
const RULE_SPELL_TYPE_ALIAS = "r_spell_type_alias";
const PASS_MESSAGE = "rule-engine preview system matches word/spell condition aliases as canonical spell.* signals";

function runScenario(ruleId, condition) {
  const eventBus = createCheckEventBus();
  const matchedEvents = captureCheckEvents(eventBus, EVT_PREVIEW_MATCHED);
  const system = createRuleEnginePreviewSystem({
    eventBus,
    executeActions: false,
    nowMs: () => 1000,
    schema: {
      signals: [
        { id: SIGNAL_ID_SPELL_ROTA, sourceEvent: EVT_WORD_DETECTED, where: { path: CONDITION_WORD_ID_PATH, eq: WORD_ID_ROTA } },
      ],
      windows: [],
      events: [],
      rules: [
        {
          id: ruleId,
          on: { all: [condition] },
          then: [{ type: EFFECT_TYPE_EVENT, id: EFFECT_ID_GRACE }],
        },
      ],
    },
  });
  runWithStartedSystem(system, () => {
    eventBus.emit(EVT_WORD_DETECTED, { word: { id: WORD_ID_ROTA }, atMs: 1000 });
  });
  return matchedEvents;
}

function expectSingleMatch(label, events, expectedRuleId) {
  if (!Array.isArray(events) || events.length !== 1) {
    failCheck(CHECK_TAG, `${label} expected exactly one preview match, got ${Array.isArray(events) ? events.length : 0}`);
  }
  const event = events[0] || {};
  if (String(event.ruleId || "") !== expectedRuleId) {
    failCheck(CHECK_TAG, `${label} expected ruleId ${expectedRuleId}, got ${String(event.ruleId || "(empty)")}`);
  }
}

expectSingleMatch(
  "word.prefix",
  runScenario(RULE_WORD_PREFIX, { type: CONDITION_TYPE_WORD, id: `word.${WORD_ID_ROTA}` }),
  RULE_WORD_PREFIX
);
expectSingleMatch(
  "word.spell_prefix_alias",
  runScenario(RULE_WORD_SPELL_PREFIX, { type: CONDITION_TYPE_WORD, id: SIGNAL_ID_SPELL_ROTA }),
  RULE_WORD_SPELL_PREFIX
);
expectSingleMatch(
  "word.bare_alias",
  runScenario(RULE_WORD_BARE, { type: CONDITION_TYPE_WORD, id: WORD_ID_ROTA }),
  RULE_WORD_BARE
);
expectSingleMatch(
  "spell.type_alias",
  runScenario(RULE_SPELL_TYPE_ALIAS, { type: CONDITION_TYPE_SPELL, id: WORD_ID_ROTA }),
  RULE_SPELL_TYPE_ALIAS
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
