import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-validator-alias-surface:v2";

const ALLOW = new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "src/content/interactions-v2/validate-wordbook-v2.js",
  "src/runtime/receiver-bootstrap.js",
  "tools/rule-engine-v2/check-wordbook-v2-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-orchestrator-v2-bootstrap-precedence-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-validator-alias-surface-v2.mjs",
]);

function findValidateSpellbookUsages() {
  const lines = runRgLines(
    "rg -n \"validateSpellbookV2\" src tools/rule-engine-v2"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((file) => !ALLOW.has(file));
}

const offenders = findValidateSpellbookUsages();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `validateSpellbookV2 usage outside allowed compatibility surface: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "validateSpellbookV2 compatibility surface is constrained (prefer validateWordbookV2)"
);
