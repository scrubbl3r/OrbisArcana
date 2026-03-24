import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Enforces canonical interactions-v2 imports with constrained legacy bridge usage.
const CHECK_TAG = "wordbook-interactions-canonical-imports:v2";
const PASS_MESSAGE = "interactions-v2 uses canonical wordbook surface (no direct spellbook-v2 imports)";

const ALLOW = Object.freeze(new Set());

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"from \\\"\\\\./spellbook-v2\\\\.js\\\"\" src/content/interactions-v2",
  ALLOW
);
failIfOffenders(CHECK_TAG, offenders, "direct spellbook-v2 imports outside allowed bridges");

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
