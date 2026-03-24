import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Restricts direct spellbook-v2 imports in src to explicit compatibility allowlist.
const CHECK_TAG = "wordbook-src-compat-module-import-surface:v2";
const PASS_MESSAGE = "src contains no direct spellbook-v2 imports";

const ALLOW = Object.freeze(new Set());

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"from ['\\\"][^'\\\"]*/spellbook-v2\\\\.js['\\\"]\" src",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "src direct spellbook-v2 imports are not allowed"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
