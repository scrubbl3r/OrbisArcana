import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Restricts legacy immediate collector alias usage to explicit compatibility files.
const CHECK_TAG = "interactions-immediate-spell-collector-alias-surface:v2";
const PASS_MESSAGE = "legacy immediate spell collector alias is constrained to explicit compatibility exports";

const ALLOW = Object.freeze(new Set([
  "src/content/interactions-v2/interactions-v2.js",
  "src/content/interactions-v2/index.js",
  "tools/rule-engine-v2/check-interactions-immediate-spell-collector-alias-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"collectImmediateEventSpellIdsFromInteractionsV2\" src tools",
  ALLOW
);
failIfOffenders(CHECK_TAG, offenders, "legacy immediate spell collector alias used outside compatibility surface");

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
