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
import { wordIdText } from "./check-spell-event-v2.mjs";

// Verifies canonical word-detected bridge path dedupes legacy spell-detected duplicate events.
const CHECK_TAG = "word-detected-bridge:v2";
const TEST_WORD_ID = "arcana";
const TEST_WORD_INTENT = "spell.arcana_test";
const TEST_WORD_PHRASE = "arcana";
const LEGACY_EVENT_ALIAS_LABEL = "spell_detected";
const PASS_MESSAGE = `${EVT_VOICE_WORD_DETECTED} bridge dispatches and dedupes legacy ${LEGACY_EVENT_ALIAS_LABEL} duplicate`;

const nowRef = { value: 1000 };
const eventBus = createCheckEventBus();
const casts = captureCheckEvents(eventBus, EVT_VOICE_SPELL_CAST);
const system = createCheckDispatchSystem({
  eventBus,
  nowMs: createFixedNowMs(nowRef.value),
  resources: createStoredGlobeResources(10),
  ruleEngineEnabled: false,
  allowLegacyFallbacks: true,
});

runWithStartedSystem(system, () => {
  const payload = {
    word: {
      id: TEST_WORD_ID,
      intent: TEST_WORD_INTENT,
      phrase: TEST_WORD_PHRASE,
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
if (wordIdText(casts[0]) !== TEST_WORD_ID) {
  failCheck(CHECK_TAG, `expected cast wordId=${TEST_WORD_ID}, got ${wordIdText(casts[0])}`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
