import { EVT_VOICE_WORD_DETECTED } from "../../src/contracts/events.js";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_SPELL_IDS_V2, CHECK_SPELL_INTENTS_V2 } from "./check-spell-constants-v2.mjs";
import { emitAxisThenWakeSelection } from "./check-wake-sequence-v2.mjs";

// Ensures wake sequence helper emits canonical ordered word-detected events.
const CHECK_TAG = CHECK_TAGS_V2.wakeSequenceRegression;
const WORD_ID_PATH = "word.id";
const PASS_MESSAGE = `wake sequence helper emits canonical ordered ${EVT_VOICE_WORD_DETECTED} events`;

const eventBus = createCheckEventBus();
const detected = captureCheckEvents(eventBus, EVT_VOICE_WORD_DETECTED);

emitAxisThenWakeSelection({
  eventBus,
  axisWordId: CHECK_SPELL_IDS_V2.pyro,
  wakeWindowToken: CHECK_SPELL_IDS_V2.rota,
  axisIntent: CHECK_SPELL_INTENTS_V2.axisSelect,
  wakeIntent: CHECK_SPELL_INTENTS_V2.wakeWindowSelect,
  axisAtMs: 1000,
  wakeAtMs: 1010,
  confidence: 0.9,
});

if (detected.length !== 2) {
  failCheck(CHECK_TAG, `expected 2 ${EVT_VOICE_WORD_DETECTED} events, got ${detected.length}`);
}

const [axisEvt, wakeEvt] = detected;
if (String(axisEvt?.word?.id || "") !== CHECK_SPELL_IDS_V2.pyro) {
  failCheck(CHECK_TAG, `axis event ${WORD_ID_PATH} mismatch: ${String(axisEvt?.word?.id || "")}`);
}
if (String(wakeEvt?.word?.id || "") !== CHECK_SPELL_IDS_V2.rota) {
  failCheck(CHECK_TAG, `wake event ${WORD_ID_PATH} mismatch: ${String(wakeEvt?.word?.id || "")}`);
}
if (String(axisEvt?.word?.intent || "") !== CHECK_SPELL_INTENTS_V2.axisSelect) {
  failCheck(CHECK_TAG, "axis event intent mismatch");
}
if (String(wakeEvt?.word?.intent || "") !== CHECK_SPELL_INTENTS_V2.wakeWindowSelect) {
  failCheck(CHECK_TAG, "wake event intent mismatch");
}
if (Number(axisEvt?.atMs) !== 1000 || Number(wakeEvt?.atMs) !== 1010) {
  failCheck(CHECK_TAG, "wake sequence timestamps mismatch");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
