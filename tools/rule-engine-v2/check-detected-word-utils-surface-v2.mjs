import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Enforces that new utility imports target the canonical detected-word module.
const CHECK_TAG = "detected-word-utils-surface:v2";
const LEGACY_SHIM_MODULE = "check-detected-spell-v2.mjs";
const CANONICAL_MODULE = "check-detected-word-v2";
const LEGACY_IMPORT_RG = `rg -n "from \\\"\\\\./${LEGACY_SHIM_MODULE.replace(".", "\\\\.")}\\\"" tools/rule-engine-v2`;
const LEGACY_IMPORT_SCOPE_LABEL = `legacy ${LEGACY_SHIM_MODULE} imports`;
const PASS_MESSAGE = `check utilities use canonical ${CANONICAL_MODULE} surface (no spell utility shim imports)`;
const ALLOW = Object.freeze(new Set([
  "tools/rule-engine-v2/check-detected-word-utils-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  LEGACY_IMPORT_RG,
  ALLOW
);

failIfOffenders(CHECK_TAG, offenders, `${LEGACY_IMPORT_SCOPE_LABEL} outside compatibility shim`);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
