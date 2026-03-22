import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfAnyRgMatches } from "./check-rg-no-matches-v2.mjs";

// Guards canonical signal-definition usage for word-detected event and word.id path.
const CHECK_TAG = "signal-definitions-word-event-surface:v2";
const TARGET = "src/content/spell-rules/signal-definitions.js";
const CANONICAL_EVENT_TOKEN = "voice.word_detected";
const LEGACY_EVENT_TOKEN = "voice.spell_detected";
const CANONICAL_PATH_TOKEN = "word.id";
const LEGACY_PATH_TOKEN = "spell.id";
const PASS_MESSAGE = `signal definitions use canonical ${CANONICAL_EVENT_TOKEN} + ${CANONICAL_PATH_TOKEN} matching surface`;

failIfAnyRgMatches(CHECK_TAG, [
  {
    rgCommand: `rg -n "${LEGACY_EVENT_TOKEN.replace(".", "\\.")}" ${TARGET}`,
    failureMessagePrefix:
      `signal definitions must use ${CANONICAL_EVENT_TOKEN} (found legacy ${LEGACY_EVENT_TOKEN})`,
  },
  {
    rgCommand: `rg -n "path:\\s*\\\"${LEGACY_PATH_TOKEN.replace(".", "\\.")}\\\"" ${TARGET}`,
    failureMessagePrefix:
      `signal definitions must match on ${CANONICAL_PATH_TOKEN} (found legacy ${LEGACY_PATH_TOKEN} path)`,
  },
]);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
