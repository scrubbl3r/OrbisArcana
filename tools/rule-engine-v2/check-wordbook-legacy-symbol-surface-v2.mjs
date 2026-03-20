import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-legacy-symbol-surface:v2";

const ALLOW = new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/spellbook-v2.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "src/content/interactions-v2/wordbook-v2.js",
  "tools/rule-engine-v2/check-wordbook-v2-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-legacy-symbol-surface-v2.mjs",
]);

function findLegacySymbolUsage() {
  const lines = runRgLines(
    "rg -n \"SPELLBOOK_V2(_[A-Z_]+)?\" src tools/rule-engine-v2"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((file) => !ALLOW.has(file));
}

const offenders = findLegacySymbolUsage();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `legacy SPELLBOOK_V2* symbol usage expanded outside compatibility surface: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "legacy SPELLBOOK_V2* symbol usage is constrained to explicit compatibility files"
);
