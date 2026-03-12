import {
  EVT_INPUT_SHAKE_TRIGGERED,
  EVT_VOICE_SPELL_CAST,
} from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_AXES_V2, CHECK_SHAKE_GROUPS_V2 } from "./check-gesture-constants-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2, CHECK_SPELL_INTENTS_V2 } from "./check-spell-constants-v2.mjs";
import { spellIdText } from "./check-spell-event-v2.mjs";
import { CHECK_MUTABLE_TIME_STARTS_V2 } from "./check-time-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";
import { emitWakeLoadPrelude } from "./check-wake-sequence-v2.mjs";

function runScenario({ wakeWindowToken, expectedSpellId, shakeGroup = "" }) {
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.shakeDetonation);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
  });
  runWithStartedSystem(system, () => {
    emitWakeLoadPrelude({
      eventBus,
      nowRef,
      advance,
      wakeWindowToken,
      axis: CHECK_AXES_V2.y,
      axisSpellId: CHECK_SPELL_IDS_V2.pyro,
      axisIntent: CHECK_SPELL_INTENTS_V2.axisSelect,
      wakeIntent: CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
    });
    advance(10);
    eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, { code: "", group: shakeGroup, atMs: nowRef.value });
  });

  const mode = shakeGroup ? `group:${shakeGroup}` : "group:(fallback)";
  assertCheck(casts.length === 1, `[shake-regression] expected 1 cast for ${wakeWindowToken} (${mode}), got ${casts.length}`);
  assertCheck(spellIdText(casts[0]) === expectedSpellId, `[shake-regression] expected spellId=${expectedSpellId}, got ${spellIdText(casts[0])}`);
  assertCheck(String(casts[0].trigger || "") === "shake_detonation", `[shake-regression] expected trigger=shake_detonation for ${wakeWindowToken}`);
}

function main() {
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.sanctum, expectedSpellId: CHECK_SPELL_IDS_V2.sanctum, shakeGroup: CHECK_SHAKE_GROUPS_V2.fallback });
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.rota, expectedSpellId: CHECK_SPELL_IDS_V2.rota, shakeGroup: CHECK_SHAKE_GROUPS_V2.fallback });
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.sanctum, expectedSpellId: CHECK_SPELL_IDS_V2.sanctum, shakeGroup: CHECK_SHAKE_GROUPS_V2.ud });
  runScenario({ wakeWindowToken: CHECK_SPELL_IDS_V2.rota, expectedSpellId: CHECK_SPELL_IDS_V2.rota, shakeGroup: CHECK_SHAKE_GROUPS_V2.fb });
  console.log("[shake-regression:v2] PASS: shake detonation works for fallback and grouped modes");
}

main();
