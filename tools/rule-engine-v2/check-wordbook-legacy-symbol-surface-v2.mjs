import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Constrains legacy SPELLBOOK_V2* symbol usage to the documented compatibility surface.
const CHECK_TAG = "wordbook-legacy-symbol-surface:v2";
const PASS_MESSAGE = "legacy SPELLBOOK_V2* symbol usage is constrained to explicit compatibility files";

const ALLOW = Object.freeze(new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/spellbook-v2.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "src/content/interactions-v2/wordbook-v2.js",
  "tools/rule-engine-v2/check-wordbook-v2-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-legacy-symbol-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"SPELLBOOK_V2(_[A-Z_]+)?\" src tools/rule-engine-v2",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "legacy SPELLBOOK_V2* symbol usage expanded outside compatibility surface"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
