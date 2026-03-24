import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Restricts direct spellbook-v2 module imports to explicit compatibility files.
const CHECK_TAG = "wordbook-compat-module-import-surface:v2";
const PASS_MESSAGE = "direct spellbook-v2.js module imports are eliminated";

const ALLOW = Object.freeze(new Set([
  "tools/rule-engine-v2/check-wordbook-compat-module-import-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"from ['\\\"][^'\\\"]*/spellbook-v2\\.js['\\\"]\" src tools",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "direct spellbook-v2.js imports are not allowed"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
