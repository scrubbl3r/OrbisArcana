import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfAnyRgMatches } from "./check-rg-no-matches-v2.mjs";

// Ensures master-control source examples use canonical word-detected event naming.
const CHECK_TAG = "master-control-word-event-surface:v2";
const TARGET = "src/content/spell-rules/rule-engine-master-control.js";
const CANONICAL_EVENT_TOKEN = "voice.word_detected";
const LEGACY_EVENT_TOKEN = "voice.spell_detected";
const PASS_MESSAGE = `master control source-event examples use canonical ${CANONICAL_EVENT_TOKEN} naming`;

failIfAnyRgMatches(CHECK_TAG, [
  {
    rgCommand: `rg -n "${LEGACY_EVENT_TOKEN.replace(".", "\\.")}" ${TARGET}`,
    failureMessagePrefix:
      `master control must use canonical ${CANONICAL_EVENT_TOKEN} surface (legacy ${LEGACY_EVENT_TOKEN} found)`,
  },
]);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
