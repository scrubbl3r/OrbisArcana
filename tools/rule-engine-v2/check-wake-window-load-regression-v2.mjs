import { buildRuleEngineFromCompiledInteractionGraphV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_MUTABLE_TIME_STARTS_V2 } from "./check-time-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";

const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const CHECK_TAG = CHECK_TAGS_V2.wakeLoadRegression;
const PASS_MESSAGE = "pyro spin chain casts flame AOE directly";

function emitDetectedWord(eventBus, wordId, atMs) {
  eventBus.emit("voice.word_detected", {
    word: { id: String(wordId || "").trim().toLowerCase() },
    atMs: Number(atMs),
  });
}

function emitSpinOpened(eventBus, { axis = CHECK_AXES_V2.y, atMs } = {}) {
  eventBus.emit("spell_window.spin_opened", {
    axis: String(axis || "").trim().toLowerCase(),
    atMs: Number(atMs),
  });
}

function main() {
  const eventBus = createCheckEventBus();
  const actions = captureCheckEvents(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.wakeLoad);
  const preview = createRuleEnginePreviewSystem({
    eventBus,
    schema: {
      signals: SIGNAL_DEFINITIONS,
      windows: WINDOW_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      rules: buildRuleEngineFromCompiledInteractionGraphV2().rules,
    },
    executeActions: true,
    nowMs,
  });

  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled: true,
  });

  runWithStartedSystem(system, () => {
    preview.start();
    emitSpinOpened(eventBus, { axis: CHECK_AXES_V2.y, atMs: nowRef.value });
    advance(10);
    emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.pyro, nowRef.value);
    preview.stop();
  });

  const triggerActions = actions.filter((evt) => String(evt?.actionType || "").toLowerCase() === "event");
  assertCheck(triggerActions.length === 1, `[${CHECK_TAG}] expected one trigger action, got ${triggerActions.length}`);
  assertCheck(String(triggerActions[0]?.actionId || "") === "aoe_flame", `[${CHECK_TAG}] expected flame AOE trigger`);

  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
