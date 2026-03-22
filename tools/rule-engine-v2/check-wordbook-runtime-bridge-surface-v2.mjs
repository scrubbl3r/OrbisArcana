import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-runtime-bridge-surface:v2";
const PASS_MESSAGE = "legacy runtime bridge import surface is constrained to dedicated compatibility contract";

const ALLOW = Object.freeze(new Set([
  "tools/rule-engine-v2/check-wordbook-runtime-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-runtime-bridge-shim-contract-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"src/voice/spellbook\\.js|from \\\"[^\\\"]*voice/spellbook\\.js\\\"\" src tools/rule-engine-v2",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "legacy runtime bridge import surface expanded unexpectedly"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
