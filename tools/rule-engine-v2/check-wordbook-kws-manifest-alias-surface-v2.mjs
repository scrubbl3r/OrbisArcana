import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "wordbook-kws-manifest-alias-surface:v2";

const ALLOW = new Set([
  "tools/rule-engine-v2/kws-manifest-from-wordbook-v2.mjs",
  "tools/rule-engine-v2/kws-manifest-from-spellbook-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-shim-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-kws-manifest-alias-surface-v2.mjs",
]);

function findLegacyBuilderUsage() {
  const lines = runRgLines(
    "rg -n \"buildKwsManifestFromSpellbookV2\" src tools/rule-engine-v2"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((file) => !ALLOW.has(file));
}

const offenders = findLegacyBuilderUsage();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `legacy buildKwsManifestFromSpellbookV2 usage outside compatibility surface: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "legacy buildKwsManifestFromSpellbookV2 usage is constrained to explicit compatibility files"
);
