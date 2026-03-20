import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-src-spellbook-v2-imports:v2";

const ALLOW = new Set([
  "src/content/interactions-v2/index.js",
  "src/content/interactions-v2/wordbook-v2.js",
  "src/content/interactions-v2/validate-spellbook-v2.js",
  "src/content/interactions-v2/validate-wordbook-v2.js",
]);

function findDirectImports() {
  const lines = runRgLines(
    "rg -n \"from \\\"[^\\\"]*spellbook-v2\\\\.js\\\"\" src"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((file) => !ALLOW.has(file));
}

const offenders = findDirectImports();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `src direct spellbook-v2 imports outside allowed compatibility files: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "src avoids direct spellbook-v2 imports outside allowed compatibility files"
);
