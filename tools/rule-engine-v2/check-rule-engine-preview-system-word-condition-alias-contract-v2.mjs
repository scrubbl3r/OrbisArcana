import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "rule-engine-preview-system-word-condition-alias-contract:v2";
const EVT_PREVIEW_MATCHED = "rule_engine.preview_matched";
const EVT_WORD_DETECTED = "voice.word_detected";

function runScenario(ruleId, condition) {
  const eventBus = createCheckEventBus();
  const matchedEvents = captureCheckEvents(eventBus, EVT_PREVIEW_MATCHED);
  const system = createRuleEnginePreviewSystem({
    eventBus,
    executeActions: false,
    nowMs: () => 1000,
    schema: {
      signals: [
        { id: "spell.rota", sourceEvent: EVT_WORD_DETECTED, where: { path: "word.id", eq: "rota" } },
      ],
      windows: [],
      events: [],
      rules: [
        {
          id: ruleId,
          on: { all: [condition] },
          then: [{ type: "event", id: "grace" }],
        },
      ],
    },
  });
  runWithStartedSystem(system, () => {
    eventBus.emit(EVT_WORD_DETECTED, { word: { id: "rota" }, atMs: 1000 });
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
  runScenario("r_word_prefix", { type: "word", id: "word.rota" }),
  "r_word_prefix"
);
expectSingleMatch(
  "word.spell_prefix_alias",
  runScenario("r_word_spell_prefix", { type: "word", id: "spell.rota" }),
  "r_word_spell_prefix"
);
expectSingleMatch(
  "word.bare_alias",
  runScenario("r_word_bare", { type: "word", id: "rota" }),
  "r_word_bare"
);
expectSingleMatch(
  "spell.type_alias",
  runScenario("r_spell_type_alias", { type: "spell", id: "rota" }),
  "r_spell_type_alias"
);

reportCheckPass(
  CHECK_TAG,
  "rule-engine preview system matches word/spell condition aliases as canonical spell.* signals"
);
