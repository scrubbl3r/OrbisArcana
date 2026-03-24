import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findMatchedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Prevents legacy runtime spellbook imports in src; canonical import is voice/wordbook.js.
const CHECK_TAG = "wordbook-src-canonical-imports:v2";
const PASS_MESSAGE = "src imports canonical voice/wordbook.js (no legacy spellbook imports)";

const offenders = findMatchedFilesFromRg(
  runRgLines,
  "rg -n \"from \\\"\\.\\./voice/spellbook\\.js\\\"|from \\\"\\.\\./\\.\\./voice/spellbook\\.js\\\"|from \\\"\\../spellbook\\.js\\\"\" src"
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "src must import canonical voice/wordbook.js (legacy spellbook import found)"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
