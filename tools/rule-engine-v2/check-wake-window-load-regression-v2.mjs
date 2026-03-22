import { EVT_VOICE_AXIS_SELECTED, EVT_VOICE_SPELL_LOADED } from "../../src/contracts/events.js";
import { assertCheck } from "./check-assert-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { CHECK_AXES_V2, CHECK_SLOTS_V2 } from "./check-gesture-constants-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { wordIdText } from "./check-spell-event-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { CHECK_MUTABLE_TIME_STARTS_V2 } from "./check-time-constants-v2.mjs";
import { createMutableNow } from "./check-time-v2.mjs";
import { emitWakeLoadPrelude } from "./check-wake-sequence-v2.mjs";

// Regression guard for wake-window load behavior and emitted slot/axis details.
const CHECK_TAG = CHECK_TAGS_V2.wakeLoadRegression;
const PASS_MESSAGE = "wake-window load flow works";

function runScenario({ axisWordId, wakeWindowToken, expectedLoadedWordId, expectedSlot }) {
  const axisTokenId = axisWordId || CHECK_SPELL_IDS_V2.pyro;
  const eventBus = createCheckEventBus();
  const loaded = captureCheckEvents(eventBus, EVT_VOICE_SPELL_LOADED);
  const axisSelected = captureCheckEvents(eventBus, EVT_VOICE_AXIS_SELECTED);
  const resources = createStoredGlobeResources(1);
  const { nowRef, nowMs, advance } = createMutableNow(CHECK_MUTABLE_TIME_STARTS_V2.wakeLoad);

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
      axisWordId: axisTokenId,
    });
  });

  assertCheck(axisSelected.length === 1, `[${CHECK_TAG}] expected axis select for ${axisTokenId} + ${wakeWindowToken}`);
  assertCheck(loaded.length === 1, `[${CHECK_TAG}] expected one loaded spell for ${axisTokenId} + ${wakeWindowToken}`);
  assertCheck(wordIdText(loaded[0]) === expectedLoadedWordId, `[${CHECK_TAG}] expected loaded word ${expectedLoadedWordId}, got ${wordIdText(loaded[0])}`);
  const axis = typeof loaded[0]?.axis === "string" ? loaded[0].axis : "";
  const slot = typeof loaded[0]?.slot === "string" ? loaded[0].slot : "";
  assertCheck(axis === CHECK_AXES_V2.y, `[${CHECK_TAG}] expected axis ${CHECK_AXES_V2.y}, got ${axis}`);
  assertCheck(slot === expectedSlot, `[${CHECK_TAG}] expected slot ${expectedSlot}, got ${slot}`);
}

function main() {
  runScenario({
    axisWordId: CHECK_SPELL_IDS_V2.pyro,
    wakeWindowToken: CHECK_SPELL_IDS_V2.sanctum,
    expectedLoadedWordId: CHECK_SPELL_IDS_V2.sanctum,
    expectedSlot: CHECK_SLOTS_V2.ud,
  });
  runScenario({
    axisWordId: CHECK_SPELL_IDS_V2.pyro,
    wakeWindowToken: CHECK_SPELL_IDS_V2.rota,
    expectedLoadedWordId: CHECK_SPELL_IDS_V2.rota,
    expectedSlot: CHECK_SLOTS_V2.fb,
  });
  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
