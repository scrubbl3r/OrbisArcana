import { buildRuleEngineFromCompiledInteractionGraphV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";

const CHECK_TAG = "are-kay-nah-pyro-regression:v2";
const PASS_MESSAGE = "are kay nah opens azerith through authored SSOT rules for detectability smoke";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";

function emitDetectedToken(eventBus, token, atMs) {
  eventBus.emit("voice.token_detected", {
    token: String(token || "").trim().toLowerCase(),
    atMs: Number(atMs),
  });
}

function main() {
  const eventBus = createCheckEventBus();
  const wakeWindows = captureCheckEvents(eventBus, EVT_RULE_ENGINE_WAKE_WIN_OPENED);
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
  emitDetectedToken(eventBus, "are kay nah", 1000);
  previewSystem.stop();

  const matchingWakeOpen = wakeWindows.filter((evt) =>
    String(evt?.ruleId || "") === "wake_are_kay_nah"
    && String(evt?.windowId || "") === "wake.are_kay_nah"
    && Array.isArray(evt?.words)
    && evt.words.includes(CHECK_SPELL_IDS_V2.azerith)
  );
  assertCheck(
    matchingWakeOpen.length === 1,
    `[${CHECK_TAG}] expected wake_are_kay_nah to open azerith once, got ${matchingWakeOpen.length}`
  );
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
