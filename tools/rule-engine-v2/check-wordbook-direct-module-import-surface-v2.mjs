import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-direct-module-import-surface:v2";

const ALLOW = new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/wordbook-v2.js",
  "src/content/interactions-v2/validate-wordbook-v2.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "tools/rule-engine-v2/check-wordbook-direct-module-import-surface-v2.mjs",
]);

function findDirectSpellbookModuleImports() {
  const lines = runRgLines(
    "rg -n \"from \\\"[^\\\"]*spellbook-v2\\.js\\\"\" src tools"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((file) => !ALLOW.has(file));
}

const offenders = findDirectSpellbookModuleImports();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `direct spellbook-v2.js imports outside compatibility surface: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "direct spellbook-v2.js import surface is constrained to explicit compatibility files"
);
