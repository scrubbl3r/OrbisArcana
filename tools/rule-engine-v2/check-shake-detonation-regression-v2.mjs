import {
  EVT_INPUT_SHAKE_TRIGGERED,
  EVT_VOICE_SPELL_CAST,
} from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { emitDetectedSpell } from "./check-detected-spell-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { emitFlatSpinWindowOpened } from "./check-flat-spin-window-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2, CHECK_SPELL_INTENTS_V2 } from "./check-spell-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";

function runScenario({ wakeWindowToken, expectedSpellId, shakeGroup = "" }) {
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(1000);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
  });
  system.start();
  try {
    emitFlatSpinWindowOpened(eventBus, { axis: "y", atMs: nowRef.value });
    emitDetectedSpell(eventBus, {
      id: CHECK_SPELL_IDS_V2.pyro,
      intent: CHECK_SPELL_INTENTS_V2.axisSelect,
      phrase: CHECK_SPELL_IDS_V2.pyro,
      atMs: nowRef.value,
    });
    advance(10);
    emitDetectedSpell(eventBus, {
      id: wakeWindowToken,
      intent: CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
      phrase: wakeWindowToken,
      atMs: nowRef.value,
    });
    advance(10);
    eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, { code: "", group: shakeGroup, atMs: nowRef.value });
  } finally {
    system.stop();
  }

  const mode = shakeGroup ? `group:${shakeGroup}` : "group:(fallback)";
  assertCheck(casts.length === 1, `[shake-regression] expected 1 cast for ${wakeWindowToken} (${mode}), got ${casts.length}`);
  assertCheck(String(casts[0].spellId || "") === expectedSpellId, `[shake-regression] expected spellId=${expectedSpellId}, got ${casts[0].spellId || ""}`);
  assertCheck(String(casts[0].trigger || "") === "shake_detonation", `[shake-regression] expected trigger=shake_detonation for ${wakeWindowToken}`);
}

function main() {
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.sanctum, expectedSpellId: CHECK_SPELL_IDS_V2.sanctum, shakeGroup: "" });
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.rota, expectedSpellId: CHECK_SPELL_IDS_V2.rota, shakeGroup: "" });
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.sanctum, expectedSpellId: CHECK_SPELL_IDS_V2.sanctum, shakeGroup: "UD" });
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.rota, expectedSpellId: CHECK_SPELL_IDS_V2.rota, shakeGroup: "FB" });
  console.log("[shake-regression:v2] PASS: shake detonation works for fallback and grouped modes");
}

main();
