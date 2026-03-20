import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "orchestrator-v2-window-semantics-event-surface:v2";
const TARGET = "tools/rule-engine-v2/check-orchestrator-v2-window-semantics-v2.mjs";

const legacyEventRefs = runRgLines(`rg -n "voice\\.spell_detected" ${TARGET}`);
if (legacyEventRefs.length) {
  failCheck(
    CHECK_TAG,
    `window semantics fixture must use voice.word_detected (found legacy voice.spell_detected): ${legacyEventRefs.join(", ")}`
  );
}

const legacyPathRefs = runRgLines(`rg -n "path:\\s*\\\"spell\\.id\\\"" ${TARGET}`);
if (legacyPathRefs.length) {
  failCheck(
    CHECK_TAG,
    `window semantics fixture must match on word.id (found legacy spell.id path): ${legacyPathRefs.join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "orchestrator v2 window semantics fixture uses canonical voice.word_detected + word.id surface"
);
