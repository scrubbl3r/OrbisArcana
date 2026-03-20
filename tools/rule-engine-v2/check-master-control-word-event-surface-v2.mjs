import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "master-control-word-event-surface:v2";
const TARGET = "src/content/spell-rules/rule-engine-master-control.js";

const legacyRefs = runRgLines(`rg -n "voice\\.spell_detected" ${TARGET}`);
if (legacyRefs.length) {
  failCheck(
    CHECK_TAG,
    `master control must use canonical voice.word_detected surface (legacy voice.spell_detected found): ${legacyRefs.join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "master control source-event examples use canonical voice.word_detected naming"
);
