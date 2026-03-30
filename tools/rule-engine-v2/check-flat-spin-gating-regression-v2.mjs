import { buildRuleEngineFromOrchestratorV2 } from "../../src/content/interactions-v2/index.js";
import { EVENT_DEFINITIONS } from "../../src/content/spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS } from "../../src/content/spell-rules/signal-definitions.js";
import { WINDOW_DEFINITIONS } from "../../src/content/spell-rules/window-definitions.js";
import { createRuleEnginePreviewSystem } from "../../src/game-runtime/triggers/rule-engine-preview-system.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_FIXED_TIMES_V2 } from "./check-time-constants-v2.mjs";
import { createFixedNowMs } from "./check-time-v2.mjs";
import { emitDetectedWord, emitSpinOpened } from "./check-wake-sequence-v2.mjs";

const CHECK_TAG = CHECK_TAGS_V2.flatSpinGating;
const PASS_MESSAGE = "spin-gated pyro chain opens only after spin input";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";

function openWindowIds(events) {
  return events.map((evt) => String(evt?.windowId || "").trim().toLowerCase()).filter(Boolean);
}

function main() {
  const eventBus = createCheckEventBus();
  const wakeOpened = captureCheckEvents(eventBus, EVT_RULE_ENGINE_WAKE_WIN_OPENED);
  const system = createRuleEnginePreviewSystem({
    eventBus,
    schema: {
      signals: SIGNAL_DEFINITIONS,
      windows: WINDOW_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      rules: buildRuleEngineFromOrchestratorV2().rules,
    },
    executeActions: true,
    nowMs: createFixedNowMs(CHECK_FIXED_TIMES_V2.flatSpinInside),
  });
  system.start();
  try {
    emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.pyro, CHECK_FIXED_TIMES_V2.flatSpinOutside);
    assertCheck(
      !openWindowIds(wakeOpened).includes("chain.spin_y_loaded"),
      `[${CHECK_TAG}] unexpected pyro window open without spin gate`
    );

    emitSpinOpened(eventBus, { axis: CHECK_AXES_V2.y, atMs: CHECK_FIXED_TIMES_V2.flatSpinInside + 10 });
    emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.pyro, CHECK_FIXED_TIMES_V2.flatSpinInside + 20);
    assertCheck(
      openWindowIds(wakeOpened).includes("chain.spin_y_loaded"),
      `[${CHECK_TAG}] expected chain.spin_y_loaded to open after spin + pyro`
    );
  } finally {
    system.stop();
  }
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
