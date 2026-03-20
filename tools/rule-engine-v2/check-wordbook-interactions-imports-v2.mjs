import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-interactions-imports:v2";

const ALLOW = new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/wordbook-v2.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "src/content/interactions-v2/validate-wordbook-v2.js",
]);

function findDirectSpellbookImports() {
  const lines = runRgLines(
    "rg -n \"from \\\"\\\\./spellbook-v2\\\\.js\\\"\" src/content/interactions-v2"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((file) => !ALLOW.has(file));
}

const offenders = findDirectSpellbookImports();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `direct spellbook-v2 imports outside allowed bridges: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "interactions-v2 uses canonical wordbook surface (direct spellbook-v2 imports only in allowed bridge files)"
);
