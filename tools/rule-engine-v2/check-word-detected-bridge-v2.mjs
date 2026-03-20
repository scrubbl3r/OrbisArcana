import {
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_WORD_DETECTED,
  EVT_VOICE_SPELL_DETECTED,
} from "../../src/contracts/events.js";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { createCheckDispatchSystem } from "./check-dispatch-system-v2.mjs";
import { createStoredGlobeResources } from "./check-resources-v2.mjs";
import { createFixedNowMs } from "./check-time-v2.mjs";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { runWithStartedSystem } from "./check-lifecycle-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "word-detected-bridge:v2";

const nowRef = { value: 1000 };
const eventBus = createCheckEventBus();
const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
const system = createCheckDispatchSystem({
  eventBus,
  nowMs: createFixedNowMs(nowRef.value),
  resources: createStoredGlobeResources(0),
  ruleEngineEnabled: false,
});

runWithStartedSystem(system, () => {
  const payload = {
    word: {
      id: "arcana",
      intent: "spell.arcana_test",
      phrase: "arcana",
    },
    confidence: 0.9,
    atMs: nowRef.value,
  };
  eventBus.emit(EVT_VOICE_WORD_DETECTED, payload);
  // Legacy bridge path should be deduped if both events are emitted for same token.
  eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
    spell: { ...payload.word },
    confidence: payload.confidence,
    atMs: payload.atMs,
  });
});

if (casts.length !== 1) {
  failCheck(CHECK_TAG, `expected exactly 1 cast after bridged word+spell events, got ${casts.length}`);
}
if (String(casts[0]?.spellId || "") !== "arcana") {
  failCheck(CHECK_TAG, `expected cast spellId=arcana, got ${String(casts[0]?.spellId || "")}`);
}

reportCheckPass(CHECK_TAG, "voice.word_detected bridge dispatches and dedupes legacy spell_detected duplicate");
