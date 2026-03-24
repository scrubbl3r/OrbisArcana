import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Restricts legacy spell-detected event references to explicit compatibility/bridge checks.
const CHECK_TAG = "word-detected-compat-event-surface:v2";
const LEGACY_EVENT_CONST_TOKEN = "EVT_VOICE_SPELL_DETECTED";
const LEGACY_EVENT_NAME_TOKEN = "voice\\.spell_detected";
const LEGACY_EVENT_SURFACE_PATTERN = `${LEGACY_EVENT_CONST_TOKEN}|${LEGACY_EVENT_NAME_TOKEN}`;
const LEGACY_EVENT_RG = `rg -n "${LEGACY_EVENT_SURFACE_PATTERN}" tools/rule-engine-v2`;
const LEGACY_EVENT_SCOPE_LABEL = "legacy spell-detected event usage";
const LEGACY_EVENT_ALLOWED_LABEL = "explicit compatibility/bridge checks";
const PASS_MESSAGE = `${LEGACY_EVENT_SCOPE_LABEL} is constrained to ${LEGACY_EVENT_ALLOWED_LABEL}`;

const ALLOW = Object.freeze(new Set([
  "tools/rule-engine-v2/check-detected-word-v2.mjs",
  "tools/rule-engine-v2/check-word-detected-bridge-v2.mjs",
  "tools/rule-engine-v2/check-signal-definitions-word-event-surface-v2.mjs",
  "tools/rule-engine-v2/check-orchestrator-v2-window-semantics-event-surface-v2.mjs",
  "tools/rule-engine-v2/check-master-control-word-event-surface-v2.mjs",
  "tools/rule-engine-v2/check-word-detected-compat-event-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  LEGACY_EVENT_RG,
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  `${LEGACY_EVENT_SCOPE_LABEL} outside allowed compatibility surface`
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
