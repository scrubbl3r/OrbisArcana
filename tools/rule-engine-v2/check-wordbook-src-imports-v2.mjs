import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-src-imports:v2";

function findLegacySrcImports() {
  const lines = runRgLines(
    "rg -n \"from \\\"\\.\\./voice/spellbook\\.js\\\"|from \\\"\\.\\./\\.\\./voice/spellbook\\.js\\\"|from \\\"\\../spellbook\\.js\\\"\" src"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean);
}

const offenders = findLegacySrcImports();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `src must import canonical voice/wordbook.js (legacy spellbook import found): ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(CHECK_TAG, "src imports canonical voice/wordbook.js (no legacy spellbook imports)");
