import {
  EVT_VOICE_SPELL_LOADED,
  EVT_VOICE_SPELL_REJECTED,
} from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { CHECK_CONFIDENCE_V2 } from "./check-confidence-constants-v2.mjs";
import { emitDetectedSpell } from "./check-detected-spell-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { emitFlatSpinWindowOpened } from "./check-flat-spin-window-v2.mjs";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";
import { CHECK_REASONS_V2, hasReason } from "./check-reason-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2, CHECK_SPELL_INTENTS_V2 } from "./check-spell-constants-v2.mjs";
import { hasSpellId } from "./check-spell-event-v2.mjs";
import { CHECK_FIXED_TIMES_V2 } from "./check-time-constants-v2.mjs";
import { createFixedNowMs } from "./check-time-v2.mjs";
import { emitAxisThenWakeSelection } from "./check-wake-sequence-v2.mjs";

function main() {
  const eventBus = createCheckEventBus();
  const rejects = captureCheckEvents(eventBus, EVT_VOICE_SPELL_REJECTED);
  const loads = captureCheckEvents(eventBus, EVT_VOICE_SPELL_LOADED);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs: createFixedNowMs(CHECK_FIXED_TIMES_V2.wakeAxisPrereq),
    resources: createStoredGlobeResources(2),
  });

  runWithStartedSystem(system, () => {
    emitFlatSpinWindowOpened(eventBus, { axis: CHECK_AXES_V2.y, atMs: CHECK_FIXED_TIMES_V2.wakeAxisPrereq });

    // Wake-window token before axis selection must be rejected.
    emitDetectedSpell(eventBus, {
      id: CHECK_SPELL_IDS_V2.sanctum,
      intent: CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
      confidence: CHECK_CONFIDENCE_V2.medium,
      atMs: CHECK_FIXED_TIMES_V2.wakeAxisPrereq,
    });

    // After axis selection, same wake-window token should load.
    emitAxisThenWakeSelection({
      eventBus,
      axisSpellId: CHECK_SPELL_IDS_V2.pyro,
      wakeWindowToken: CHECK_SPELL_IDS_V2.sanctum,
      axisIntent: CHECK_SPELL_INTENTS_V2.axisSelect,
      wakeIntent: CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
      confidence: CHECK_CONFIDENCE_V2.medium,
      axisAtMs: 5001,
      wakeAtMs: 5002,
    });
  });

  assertCheck(
    hasReason(rejects, CHECK_REASONS_V2.noAxisSelected),
    `[wake-window-axis-prereq:v2] expected ${CHECK_REASONS_V2.noAxisSelected} reject when wake token spoken before axis token`
  );
  assertCheck(loads.length >= 1, "[wake-window-axis-prereq:v2] expected wake token to load after axis selection");
  assertCheck(
    hasSpellId(loads, CHECK_SPELL_IDS_V2.sanctum),
    "[wake-window-axis-prereq:v2] expected sanctum load after axis selection"
  );

  console.log("[wake-window-axis-prereq:v2] PASS: wake-window axis prerequisite contract holds");
}

main();
