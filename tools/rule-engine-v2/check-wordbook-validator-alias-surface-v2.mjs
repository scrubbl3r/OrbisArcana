import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Restricts legacy validateSpellbookV2 calls to explicit compatibility boundaries.
const CHECK_TAG = "wordbook-validator-alias-surface:v2";
const PASS_MESSAGE = "validateSpellbookV2 compatibility surface is constrained (prefer validateWordbookV2)";

const ALLOW = Object.freeze(new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "src/content/interactions-v2/validate-wordbook-v2.js",
  "src/runtime/receiver-bootstrap.js",
  "tools/rule-engine-v2/check-wordbook-v2-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-orchestrator-v2-bootstrap-precedence-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-validator-alias-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"validateSpellbookV2\" src tools/rule-engine-v2",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "validateSpellbookV2 usage outside allowed compatibility surface"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
