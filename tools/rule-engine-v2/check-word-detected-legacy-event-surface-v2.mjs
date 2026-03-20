import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "word-detected-legacy-event-surface:v2";

const ALLOW = new Set([
  "tools/rule-engine-v2/check-detected-word-v2.mjs",
  "tools/rule-engine-v2/check-word-detected-bridge-v2.mjs",
  "tools/rule-engine-v2/check-signal-definitions-word-event-surface-v2.mjs",
  "tools/rule-engine-v2/check-orchestrator-v2-window-semantics-event-surface-v2.mjs",
  "tools/rule-engine-v2/check-master-control-word-event-surface-v2.mjs",
  "tools/rule-engine-v2/check-word-detected-legacy-event-surface-v2.mjs",
]);

function findLegacyEventRefs() {
  return runRgLines("rg -n \"EVT_VOICE_SPELL_DETECTED|voice\\\\.spell_detected\" tools/rule-engine-v2")
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((rel) => !ALLOW.has(rel));
}

const offenders = findLegacyEventRefs();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `legacy spell-detected event usage outside allowed compatibility surface: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "legacy spell-detected event usage is constrained to explicit compatibility/bridge checks"
);
