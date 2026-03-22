import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Ensures master-control file references stay within an explicit compatibility boundary.
const CHECK_TAG = "master-control-import-boundary:v2";
const MASTER_CONTROL_FILE_TOKEN = "rule-engine-master-control\\.js";
const IMPORT_BOUNDARY_SCOPE = "src tools";
const NODE_MODULES_GLOB_EXCLUDE = "--glob '!**/node_modules/**'";
const OFFENDER_MESSAGE = "direct master-control import/path usage outside boundary";
const PASS_MESSAGE = "master-control file access is boundary-limited";
const MASTER_CONTROL_RG = `rg -n "${MASTER_CONTROL_FILE_TOKEN}" ${IMPORT_BOUNDARY_SCOPE} ${NODE_MODULES_GLOB_EXCLUDE}`;

const ALLOW = Object.freeze(new Set([
  "src/content/spell-rules/index.js",
  "tools/rule-engine-v2/check-master-control-compat-surface-v2.mjs",
  "tools/rule-engine-v2/check-master-control-word-event-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  MASTER_CONTROL_RG,
  ALLOW
);

failIfOffenders(
  CHECK_TAG,
  offenders,
  OFFENDER_MESSAGE
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
