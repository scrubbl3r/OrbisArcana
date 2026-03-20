import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "interactions-immediate-spell-collector-alias-surface:v2";

const ALLOW = new Set([
  "src/content/interactions-v2/interactions-v2.js",
  "src/content/interactions-v2/index.js",
  "tools/rule-engine-v2/check-interactions-immediate-spell-collector-alias-surface-v2.mjs",
]);

function findAliasRefsOutsideCompatibilitySurface() {
  const lines = runRgLines(
    "rg -n \"collectImmediateEventSpellIdsFromInteractionsV2\" src tools"
  );
  return lines
    .map((line) => line.split(":")[0])
    .filter(Boolean)
    .filter((rel) => !ALLOW.has(rel));
}

const offenders = findAliasRefsOutsideCompatibilitySurface();
if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `legacy immediate spell collector alias used outside compatibility surface: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "legacy immediate spell collector alias is constrained to explicit compatibility exports"
);
