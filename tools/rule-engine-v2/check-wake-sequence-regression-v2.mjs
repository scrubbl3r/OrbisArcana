import { EVT_VOICE_WORD_DETECTED } from "../../src/contracts/events.js";
import { captureCheckEvents } from "./check-capture-v2.mjs";
import { createCheckEventBus } from "./check-event-bus-v2.mjs";
import { CHECK_TAGS_V2 } from "./check-tags-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { CHECK_SPELL_IDS_V2 } from "./check-spell-constants-v2.mjs";
import { emitDetectedWord, emitPyroBindPrelude } from "./check-wake-sequence-v2.mjs";

// Ensures current exemplar helper emits canonical ordered word-detected events.
const CHECK_TAG = CHECK_TAGS_V2.wakeSequenceRegression;
const WORD_ID_PATH = "word.id";
const PASS_MESSAGE = `wake sequence helper emits canonical ordered ${EVT_VOICE_WORD_DETECTED} events`;

const eventBus = createCheckEventBus();
const detected = captureCheckEvents(eventBus, EVT_VOICE_WORD_DETECTED);

emitPyroBindPrelude({
  eventBus,
  startAtMs: 1000,
});
emitDetectedWord(eventBus, CHECK_SPELL_IDS_V2.rota, 1030);

if (detected.length !== 2) {
  failCheck(CHECK_TAG, `expected 2 ${EVT_VOICE_WORD_DETECTED} events, got ${detected.length}`);
}

const [pyroEvt, rotaEvt] = detected;
if (String(pyroEvt?.word?.id || "") !== CHECK_SPELL_IDS_V2.pyro) {
  failCheck(CHECK_TAG, `first event ${WORD_ID_PATH} mismatch: ${String(pyroEvt?.word?.id || "")}`);
}
if (String(rotaEvt?.word?.id || "") !== CHECK_SPELL_IDS_V2.rota) {
  failCheck(CHECK_TAG, `second event ${WORD_ID_PATH} mismatch: ${String(rotaEvt?.word?.id || "")}`);
}
if (Number(pyroEvt?.atMs) !== 1020 || Number(rotaEvt?.atMs) !== 1030) {
  failCheck(CHECK_TAG, "wake sequence timestamps mismatch");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
