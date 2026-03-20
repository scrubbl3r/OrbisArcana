import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-runtime-bridge-surface:v2";

const ALLOW = new Set([
  "tools/rule-engine-v2/check-wordbook-runtime-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-runtime-bridge-shim-contract-v2.mjs",
]);

function findRuntimeBridgeImports() {
  const lines = runRgLines(
    "rg -n \"src/voice/spellbook\\.js|from \\\"[^\\\"]*voice/spellbook\\.js\\\"\" src tools/rule-engine-v2"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((file) => !ALLOW.has(file));
}

const offenders = findRuntimeBridgeImports();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `legacy runtime bridge import surface expanded unexpectedly: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "legacy runtime bridge import surface is constrained to dedicated compatibility contract"
);
