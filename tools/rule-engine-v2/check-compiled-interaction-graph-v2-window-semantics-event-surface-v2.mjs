import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfAnyRgMatches } from "./check-rg-no-matches-v2.mjs";

const CHECK_TAG = "compiled-interaction-graph-v2-window-semantics-event-surface:v2";
const TARGET = "tools/rule-engine-v2/check-compiled-interaction-graph-v2-window-semantics-v2.mjs";
const CANONICAL_EVENT_TOKEN = "voice.word_detected";
const LEGACY_EVENT_TOKEN = "voice.spell_detected";
const CANONICAL_PATH_TOKEN = "word.id";
const LEGACY_PATH_TOKEN = "spell.id";
const PASS_MESSAGE = `compiled interaction graph v2 window semantics fixture uses canonical ${CANONICAL_EVENT_TOKEN} + ${CANONICAL_PATH_TOKEN} surface`;

failIfAnyRgMatches(CHECK_TAG, [
  {
    rgCommand: `rg -n "${LEGACY_EVENT_TOKEN.replace(".", "\\.")}" ${TARGET}`,
    failureMessagePrefix:
      `window semantics fixture must use ${CANONICAL_EVENT_TOKEN} (found legacy ${LEGACY_EVENT_TOKEN})`,
  },
  {
    rgCommand: `rg -n "path:\\s*\\\"${LEGACY_PATH_TOKEN.replace(".", "\\.")}\\\"" ${TARGET}`,
    failureMessagePrefix:
      `window semantics fixture must match on ${CANONICAL_PATH_TOKEN} (found legacy ${LEGACY_PATH_TOKEN} path)`,
  },
]);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
