import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Restricts direct spellbook-v2 imports in src to explicit compatibility allowlist.
const CHECK_TAG = "wordbook-src-spellbook-v2-imports:v2";
const PASS_MESSAGE = "src avoids direct spellbook-v2 imports outside allowed compatibility files";

const ALLOW = Object.freeze(new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/wordbook-v2.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "src/content/interactions-v2/validate-wordbook-v2.js",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"from \\\"[^\\\"]*spellbook-v2\\\\.js\\\"\" src",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "src direct spellbook-v2 imports outside allowed compatibility files"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
