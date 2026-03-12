import {
  EVT_VOICE_AXIS_SELECTED,
  EVT_VOICE_SPELL_REJECTED,
} from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { CHECK_CONFIDENCE_V2 } from "./check-confidence-constants-v2.mjs";
import { emitDetectedSpellAt } from "./check-detected-spell-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { emitFlatSpinWindowOpened } from "./check-flat-spin-window-v2.mjs";
import { CHECK_AXES_V2 } from "./check-gesture-constants-v2.mjs";
import { CHECK_REASONS_V2, hasReason, reasonList } from "./check-reason-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2, CHECK_SPELL_INTENTS_V2 } from "./check-spell-constants-v2.mjs";
import { CHECK_FIXED_TIMES_V2 } from "./check-time-constants-v2.mjs";
import { createFixedNowMs } from "./check-time-v2.mjs";

function detectOutsideWindow({ spellId, intent, expectedReason }) {
  const eventBus = createCheckEventBus();
  const rejects = captureCheckEvents(eventBus, EVT_VOICE_SPELL_REJECTED);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs: createFixedNowMs(CHECK_FIXED_TIMES_V2.flatSpinOutside),
    resources: createStoredGlobeResources(1),
  });
  runWithStartedSystem(system, () => {
    emitDetectedSpellAt(eventBus, {
      id: spellId,
      intent,
      confidence: CHECK_CONFIDENCE_V2.high,
      atMs: CHECK_FIXED_TIMES_V2.flatSpinOutside,
    });
  });
  assertCheck(rejects.length >= 1, `[flat-spin-gating:v2] expected reject for ${spellId} outside flat-spin window`);
  assertCheck(
    hasReason(rejects, expectedReason),
    `[flat-spin-gating:v2] expected reason=${expectedReason} for ${spellId}; got [${reasonList(rejects).join(", ")}]`
  );
}

function detectInsideWindowAxisSelect() {
  const eventBus = createCheckEventBus();
  const axisSelected = captureCheckEvents(eventBus, EVT_VOICE_AXIS_SELECTED);
  const rejects = captureCheckEvents(eventBus, EVT_VOICE_SPELL_REJECTED);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs: createFixedNowMs(CHECK_FIXED_TIMES_V2.flatSpinInside),
    resources: createStoredGlobeResources(1),
  });
  runWithStartedSystem(system, () => {
    emitFlatSpinWindowOpened(eventBus, { axis: CHECK_AXES_V2.y, atMs: CHECK_FIXED_TIMES_V2.flatSpinInside });
    emitDetectedSpellAt(eventBus, {
      id: CHECK_SPELL_IDS_V2.pyro,
      intent: CHECK_SPELL_INTENTS_V2.axisSelect,
      confidence: CHECK_CONFIDENCE_V2.high,
      atMs: CHECK_FIXED_TIMES_V2.flatSpinInside,
    });
  });
  assertCheck(axisSelected.length === 1, "[flat-spin-gating:v2] expected axis select event for pyro inside flat-spin window");
  assertCheck(rejects.length === 0, `[flat-spin-gating:v2] unexpected reject(s) for pyro inside flat-spin window: ${rejects.map((r) => r.reason).join(", ")}`);
}

function main() {
  detectOutsideWindow({
    spellId: CHECK_SPELL_IDS_V2.pyro,
    intent: CHECK_SPELL_INTENTS_V2.axisSelect,
    expectedReason: CHECK_REASONS_V2.ruleEngineOwnedImmediateSpell,
  });
  detectInsideWindowAxisSelect();
  reportCheckPass("flat-spin-gating:v2", "flat-spin token gating contract holds");
}

main();
