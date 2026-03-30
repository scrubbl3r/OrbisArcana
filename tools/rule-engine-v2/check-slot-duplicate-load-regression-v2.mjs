import {
  EVT_SPELL_SLOT_LOAD_REQUESTED,
  EVT_SPELL_SLOT_CAST_REQUESTED,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_LOADED,
  EVT_VOICE_SPELL_REJECTED,
} from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_SLOTS_V2 } from "./check-gesture-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { wordIdText } from "./check-spell-event-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_MUTABLE_TIME_STARTS_V2 } from "./check-time-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";

const CHECK_TAG = CHECK_TAGS_V2.slotDuplicateLoadRegression;
const PASS_MESSAGE = "duplicate same-spell slot loads reject before consuming extra globes";

function main() {
  const eventBus = createCheckEventBus();
  const loaded = captureCheckEvents(eventBus, EVT_VOICE_SPELL_LOADED);
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const rejected = captureCheckEvents(eventBus, EVT_VOICE_SPELL_REJECTED);
  const baseResources = createStoredGlobeResources(2);
  let consumeCalls = 0;
  const resources = {
    getStoredGlobeCount: () => baseResources.getStoredGlobeCount(),
    consumeStoredGlobe: (payload = {}) => {
      consumeCalls += 1;
      return baseResources.consumeStoredGlobe(payload);
    },
  };
  const { nowRef, nowMs, advance } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.wakeLoad);
  const system = createCheckDispatchSystem({
    eventBus,
    nowMs,
    resources,
    ruleEngineEnabled: true,
  });

  runWithStartedSystem(system, () => {
    eventBus.emit(EVT_SPELL_SLOT_LOAD_REQUESTED, {
      wordId: "sanctum_shield",
      slot: CHECK_SLOTS_V2.fb,
      atMs: nowRef.value,
      trigger: "test_direct_load",
    });
    advance(10);
    eventBus.emit(EVT_SPELL_SLOT_LOAD_REQUESTED, {
      wordId: "sanctum_shield",
      slot: CHECK_SLOTS_V2.fb,
      atMs: nowRef.value,
      trigger: "test_direct_load",
    });
    advance(10);
    eventBus.emit(EVT_SPELL_SLOT_CAST_REQUESTED, {
      slot: CHECK_SLOTS_V2.fb,
      directionGroup: CHECK_SLOTS_V2.fb,
      atMs: nowRef.value,
      trigger: "test_slot_cast",
    });
    advance(10);
    eventBus.emit(EVT_SPELL_SLOT_CAST_REQUESTED, {
      slot: CHECK_SLOTS_V2.fb,
      directionGroup: CHECK_SLOTS_V2.fb,
      atMs: nowRef.value,
      trigger: "test_slot_cast",
    });
  });

  assertCheck(loaded.length === 1, `[${CHECK_TAG}] expected only one successful slot load, got ${loaded.length}`);
  assertCheck(rejected.length >= 1, `[${CHECK_TAG}] expected duplicate load rejection`);
  assertCheck(String(rejected[0]?.reason || "") === "slot_already_contains_spell", `[${CHECK_TAG}] expected slot_already_contains_spell, got ${String(rejected[0]?.reason || "")}`);
  assertCheck(consumeCalls === 1, `[${CHECK_TAG}] expected one globe consumed for the first load only, got ${consumeCalls}`);
  assertCheck(baseResources.getStoredGlobeCount() === 1, `[${CHECK_TAG}] expected one globe remaining after duplicate rejection, got ${baseResources.getStoredGlobeCount()}`);
  assertCheck(casts.length === 2, `[${CHECK_TAG}] expected loaded cast then fallback cast, got ${casts.length}`);
  assertCheck(wordIdText(casts[0]) === "sanctum_shield", `[${CHECK_TAG}] expected first cast sanctum_shield, got ${wordIdText(casts[0])}`);
  assertCheck(wordIdText(casts[1]) === "shockwave", `[${CHECK_TAG}] expected fallback cast shockwave, got ${wordIdText(casts[1])}`);
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
