import {
  EVT_VOICE_AXIS_SELECTED,
  EVT_VOICE_SPELL_LOADED,
} from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { emitDetectedSpell } from "./check-detected-spell-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { emitFlatSpinWindowOpened } from "./check-flat-spin-window-v2.mjs";
import { CHECK_AXES_V2, CHECK_SLOTS_V2 } from "./check-gesture-constants-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2, CHECK_SPELL_INTENTS_V2 } from "./check-spell-constants-v2.mjs";
import { spellIdText } from "./check-spell-event-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";

function runScenario({ axisSpellId, wakeWindowToken, expectedLoadedSpellId, expectedSlot }) {
  const eventBus = createCheckEventBus();
  const loaded = captureCheckEvents(eventBus, EVT_VOICE_SPELL_LOADED);
  const axisSelected = captureCheckEvents(eventBus, EVT_VOICE_AXIS_SELECTED);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(2000);

  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
  });

  system.start();
  try {
    emitFlatSpinWindowOpened(eventBus, { axis: CHECK_AXES_V2.y, atMs: nowRef.value });
    emitDetectedSpell(eventBus, {
      id: axisSpellId,
      intent: CHECK_SPELL_INTENTS_V2.axisSelect,
      phrase: axisSpellId,
      atMs: nowRef.value,
    });
    advance(10);
    emitDetectedSpell(eventBus, {
      id: wakeWindowToken,
      intent: CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
      phrase: wakeWindowToken,
      atMs: nowRef.value,
    });
  } finally {
    system.stop();
  }

  assertCheck(axisSelected.length === 1, `[wake-load-regression] expected axis select for ${axisSpellId} + ${wakeWindowToken}`);
  assertCheck(loaded.length === 1, `[wake-load-regression] expected one loaded spell for ${axisSpellId} + ${wakeWindowToken}`);
  assertCheck(spellIdText(loaded[0]) === expectedLoadedSpellId, `[wake-load-regression] expected loaded spell ${expectedLoadedSpellId}, got ${spellIdText(loaded[0])}`);
  assertCheck(String(loaded[0].axis || "") === CHECK_AXES_V2.y, `[wake-load-regression] expected axis ${CHECK_AXES_V2.y}, got ${loaded[0].axis || ""}`);
  assertCheck(String(loaded[0].slot || "") === expectedSlot, `[wake-load-regression] expected slot ${expectedSlot}, got ${loaded[0].slot || ""}`);
}

function main() {
  runScenario({
    axisSpellId: CHECK_SPELL_IDS_V2.pyro,
    wakeWindowToken: CHECK_SPELL_IDS_V2.sanctum,
    expectedLoadedSpellId: CHECK_SPELL_IDS_V2.sanctum,
    expectedSlot: CHECK_SLOTS_V2.ud,
  });
  runScenario({
    axisSpellId: CHECK_SPELL_IDS_V2.pyro,
    wakeWindowToken: CHECK_SPELL_IDS_V2.rota,
    expectedLoadedSpellId: CHECK_SPELL_IDS_V2.rota,
    expectedSlot: CHECK_SLOTS_V2.fb,
  });
  console.log("[wake-load-regression:v2] PASS: wake-window load flow works");
}

main();
