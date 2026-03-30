import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";
import { emitDetectedWord, emitSpinOpened } from "./check-wake-sequence-v2.mjs";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";

const CHECK_TAG = CHECK_TAGS_V2.wakeWindowAxisPrereq;
const PASS_MESSAGE = "pyro bind chain requires its authored intermediate window";
const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";

function main() {
  const eventBus = createCheckEventBus();
  const actions = captureCheckEvents(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED);
  const { nowRef, nowMs, advance } = createMutableNow(5000);
  const system = createRuleEnginePreviewSystem({
    eventBus,
    schema: {
      signals: SIGNAL_DEFINITIONS,
      windows: WINDOW_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      rules: buildRuleEngineFromOrchestratorV2().rules,
    },
    executeActions: true,
    nowMs,
  });

  system.start();
  try {
    emitSpinOpened(eventBus, { axis: CHECK_AXES_V2.y, atMs: nowRef.value });

    // Missing authored intermediate word (`pyro`) means `rota` must not bind.
    advance(10);
    emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.rota, nowRef.value);
    const bindCountBefore = actions.filter((evt) => String(evt?.actionType || "").toLowerCase() === "bind").length;
    assertCheck(bindCountBefore === 0, `[${CHECK_TAG}] unexpected bind without pyro intermediate window`);

    // With authored intermediate window opened, `rota` should bind.
    advance(10);
    emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.pyro, nowRef.value);
    advance(10);
    emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.rota, nowRef.value);
    const bindActions = actions.filter((evt) => String(evt?.actionType || "").toLowerCase() === "bind");
    assertCheck(bindActions.length === 1, `[${CHECK_TAG}] expected one bind after pyro -> rota, got ${bindActions.length}`);
  } finally {
    system.stop();
  }

  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
