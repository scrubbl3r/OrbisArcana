import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/systems/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "shockwave-authored-regression:v2";
const PASS_MESSAGE = "ud shake triggers authored shockwave through the orchestrator rule path";

function main() {
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
      ...buildRuleEngineFromOrchestratorV2(),
    },
  });

  previewSystem.start();
  eventBus.emit("input.shake_triggered", { group: "UD", code: "U", atMs: 1000 });
  previewSystem.stop();

  const shockwaveActions = executedActions.filter((evt) =>
    String(evt?.actionType || "") === "event"
    && String(evt?.actionId || "") === "shockwave"
    && String(evt?.ruleId || "") === "shake_ud_cast"
  );

  assertCheck(
    shockwaveActions.length === 1,
    `[${CHECK_TAG}] expected one authored shockwave action after UD shake, got ${shockwaveActions.length}`
  );
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
