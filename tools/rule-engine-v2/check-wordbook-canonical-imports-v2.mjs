import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Ensures tooling imports canonical wordbook modules instead of legacy shims.
const CHECK_TAG = "wordbook-canonical-imports:v2";
const PASS_MESSAGE = "tools use canonical wordbook imports (legacy shims are not imported)";

const ALLOW = Object.freeze(new Set([
  "tools/rule-engine-v2/check-wordbook-shim-alias-contract-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"from \\\"\\\\./(spellbook-v2-utils|kws-manifest-from-spellbook-v2)\\\\.mjs\\\"\" tools/rule-engine-v2",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "legacy shim imports must be replaced with canonical wordbook modules"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
