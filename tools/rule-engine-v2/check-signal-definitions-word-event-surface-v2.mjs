import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "signal-definitions-word-event-surface:v2";
const TARGET = "src/content/spell-rules/signal-definitions.js";

const legacyEventRefs = runRgLines(
  `rg -n "voice\\.spell_detected" ${TARGET}`
);
if (legacyEventRefs.length) {
  failCheck(
    CHECK_TAG,
    `signal definitions must use voice.word_detected (found legacy voice.spell_detected): ${legacyEventRefs.join(", ")}`
  );
}

const legacyPathRefs = runRgLines(
  `rg -n "path:\\s*\\\"spell\\.id\\\"" ${TARGET}`
);
if (legacyPathRefs.length) {
  failCheck(
    CHECK_TAG,
    `signal definitions must match on word.id (found legacy spell.id path): ${legacyPathRefs.join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "signal definitions use canonical voice.word_detected + word.id matching surface"
);
