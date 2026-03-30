import { buildRuleEngineFromCompiledInteractionGraphV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "shockwave-authored-regression:v2";
const PASS_MESSAGE = "ud/lr/fb shake triggers authored shockwave through the orchestrator rule path";

const EXPECTED_RULE_ID_BY_GROUP = Object.freeze({
  UD: "shake_ud_cast",
  LR: "shake_lr_cast",
  FB: "shake_fb_cast",
});

function assertSingleShockwaveAction(executedActions, ruleId, shakeGroup) {
  const shockwaveActions = executedActions.filter((evt) =>
    String(evt?.actionType || "") === "event"
    && String(evt?.actionId || "") === "shockwave"
    && String(evt?.ruleId || "") === ruleId
  );
  assertCheck(
    shockwaveActions.length === 1,
    `[${CHECK_TAG}] expected one authored shockwave action after ${shakeGroup} shake, got ${shockwaveActions.length}`
  );
}

function runScenario(shakeGroup, code) {
  const eventBus = createCheckEventBus();
  const executedActions = captureCheckEvents(eventBus, "rule_engine.action_executed");
  const previewSystem = createRuleEnginePreviewSystem({
    eventBus,
    executeActions: true,
    nowMs: () => 1000,
    schema: {
      signals: SIGNAL_DEFINITIONS,
      windows: WINDOW_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      ...buildRuleEngineFromCompiledInteractionGraphV2(),
    },
  });

  previewSystem.start();
  eventBus.emit("input.shake_triggered", { group: shakeGroup, code, atMs: 1000 });
  previewSystem.stop();

  assertSingleShockwaveAction(
    executedActions,
    String(EXPECTED_RULE_ID_BY_GROUP[shakeGroup] || ""),
    shakeGroup
  );
}

function main() {
  runScenario("UD", "U");
  runScenario("LR", "L");
  runScenario("FB", "F");
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
