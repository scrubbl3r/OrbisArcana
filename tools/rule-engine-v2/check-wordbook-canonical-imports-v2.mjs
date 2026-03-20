import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-canonical-imports:v2";

function findLegacyImportOffenders() {
  const lines = runRgLines(
    "rg -n \"from \\\"\\\\./(spellbook-v2-utils|kws-manifest-from-spellbook-v2)\\\\.mjs\\\"\" tools/rule-engine-v2"
  );
  const allow = new Set([
    "tools/rule-engine-v2/check-wordbook-shim-alias-contract-v2.mjs",
  ]);
  return lines
    .map((line) => line.split(":")[0])
    .filter((file) => !allow.has(file))
    .filter(Boolean);
}

const offenders = findLegacyImportOffenders();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `legacy shim imports must be replaced with canonical wordbook modules: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(CHECK_TAG, "tools use canonical wordbook imports (legacy shims are not imported)");
