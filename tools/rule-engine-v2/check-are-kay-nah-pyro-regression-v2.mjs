import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { emitDetectedWord } from "./check-wake-sequence-v2.mjs";

const CHECK_TAG = "are-kay-nah-pyro-regression:v2";
const PASS_MESSAGE = "are kay nah opens pyro, then pyro opens sanctum/rota and triggers sanctum_shield or aoe_flame through authored SSOT rules";
const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";

function emitDetectedToken(eventBus, token, atMs) {
  eventBus.emit("voice.token_detected", {
    token: String(token || "").trim().toLowerCase(),
    atMs: Number(atMs),
  });
}

function runScenario({ finalWordId, expectedRuleId, expectedActionId }) {
  const eventBus = createCheckEventBus();
  const executedActions = captureCheckEvents(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED);
  const previewSystem = createRuleEnginePreviewSystem({
    eventBus,
    executeActions: true,
    nowMs: () => 1000,
    schema: {
      signals: SIGNAL_DEFINITIONS,
      windows: WINDOW_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      ...buildRuleEngineFromOrchestratorV2(),
    },
  });

  previewSystem.start();
  emitDetectedToken(eventBus, "are kay nah", 1000);
  emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.pyro, 1010);
  emitDetectedWord(eventBus, finalWordId, 1020);
  previewSystem.stop();

  const matchingActions = executedActions.filter((evt) =>
    String(evt?.actionType || "") === "event"
    && String(evt?.ruleId || "") === expectedRuleId
    && String(evt?.actionId || "") === expectedActionId
  );

  assertCheck(
    matchingActions.length === 1,
    `[${CHECK_TAG}] expected one ${expectedActionId} action from ${expectedRuleId}, got ${matchingActions.length}`
  );
}

function main() {
  runScenario({
    finalWordId: CHECK_SPELL_IDS_V2.sanctum,
    expectedRuleId: "pyro_sanctum_cast",
    expectedActionId: "sanctum_shield",
  });
  runScenario({
    finalWordId: CHECK_SPELL_IDS_V2.rota,
    expectedRuleId: "pyro_rota_cast",
    expectedActionId: "aoe_flame",
  });
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
