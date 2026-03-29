import {
  EVT_SPELL_SLOT_LOAD_REQUESTED,
  EVT_SPELL_SLOT_CAST_REQUESTED,
  EVT_VOICE_SPELL_CAST,
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

const CHECK_TAG = CHECK_TAGS_V2.spellCostRegression;
const PASS_MESSAGE = "paid spells require globes while default shockwave remains free";

function main() {
  const eventBus = createCheckEventBus();
  const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
  const rejected = captureCheckEvents(eventBus, EVT_VOICE_SPELL_REJECTED);
  const resources = createStoredGlobeResources(0);
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
    eventBus.emit(EVT_SPELL_SLOT_CAST_REQUESTED, {
      slot: CHECK_SLOTS_V2.fb,
      directionGroup: CHECK_SLOTS_V2.fb,
      atMs: nowRef.value,
      trigger: "test_slot_cast",
    });
    advance(10);
    eventBus.emit(EVT_SPELL_SLOT_LOAD_REQUESTED, {
      wordId: "shockwave",
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
  });

  assertCheck(casts.length === 1, `[${CHECK_TAG}] expected only one successful cast, got ${casts.length}`);
  assertCheck(wordIdText(casts[0]) === "shockwave", `[${CHECK_TAG}] expected the free fallback cast to be shockwave, got ${wordIdText(casts[0])}`);

  assertCheck(rejected.length >= 1, `[${CHECK_TAG}] expected at least one rejection for zero-globe paid cast`);
  assertCheck(String(rejected[0]?.reason || "") === "insufficient_globes", `[${CHECK_TAG}] expected rejection reason insufficient_globes, got ${String(rejected[0]?.reason || "")}`);
  assertCheck(String(rejected[0]?.wordId || "") === "sanctum_shield", `[${CHECK_TAG}] expected rejected spell sanctum_shield, got ${String(rejected[0]?.wordId || "")}`);
  assertCheck(Number(rejected[0]?.requiredGlobes || 0) === 1, `[${CHECK_TAG}] expected requiredGlobes=1, got ${Number(rejected[0]?.requiredGlobes || 0)}`);
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
