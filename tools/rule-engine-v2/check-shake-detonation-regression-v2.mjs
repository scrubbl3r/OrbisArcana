import { EVT_INPUT_SHAKE_TRIGGERED, EVT_SPELL_SLOT_LOAD_REQUESTED, EVT_VOICE_SPELL_CAST } from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_SHAKE_GROUPS_V2 } from "./check-gesture-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { wordIdText } from "./check-spell-event-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_MUTABLE_TIME_STARTS_V2 } from "./check-time-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";
// Regression guard for shake detonation across fallback and grouped trigger modes.
const CHECK_TAG = CHECK_TAGS_V2.shakeRegression;
const PASS_MESSAGE = "shake detonation works for direct slot loads and grouped shakes";

function runScenario({ wordId, slot, expectedWordId, shakeGroup = "" }) {
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
    eventBus.emit(EVT_SPELL_SLOT_LOAD_REQUESTED, {
      wordId,
      slot,
      atMs: nowRef.value,
      trigger: "test_direct_load",
    });
    advance(10);
    eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, { code: "", group: shakeGroup, atMs: nowRef.value });
  });

  const mode = shakeGroup ? `group:${shakeGroup}` : "group:(fallback)";
  assertCheck(casts.length === 1, `[${CHECK_TAG}] expected 1 cast for ${wordId} (${mode}), got ${casts.length}`);
  assertCheck(wordIdText(casts[0]) === expectedWordId, `[${CHECK_TAG}] expected wordId=${expectedWordId}, got ${wordIdText(casts[0])}`);
  const trigger = typeof casts[0]?.trigger === "string" ? casts[0].trigger : "";
  assertCheck(trigger === "shake_detonation", `[${CHECK_TAG}] expected trigger=shake_detonation for ${wordId}`);
}

function main() {
  runScenario({ wordId: CHECK_SPELL_IDS_V2.rota, slot: CHECK_SHAKE_GROUPS_V2.fb, expectedWordId: CHECK_SPELL_IDS_V2.rota, shakeGroup: CHECK_SHAKE_GROUPS_V2.fallback });
  runScenario({ wordId: CHECK_SPELL_IDS_V2.domus, slot: CHECK_SHAKE_GROUPS_V2.ud, expectedWordId: CHECK_SPELL_IDS_V2.domus, shakeGroup: CHECK_SHAKE_GROUPS_V2.ud });
  runScenario({ wordId: CHECK_SPELL_IDS_V2.rota, slot: CHECK_SHAKE_GROUPS_V2.fb, expectedWordId: CHECK_SPELL_IDS_V2.rota, shakeGroup: CHECK_SHAKE_GROUPS_V2.fb });
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
