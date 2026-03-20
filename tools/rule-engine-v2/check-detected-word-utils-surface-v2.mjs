import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "detected-word-utils-surface:v2";
const ALLOW = new Set([
  "tools/rule-engine-v2/check-detected-spell-v2.mjs",
  "tools/rule-engine-v2/check-detected-word-utils-surface-v2.mjs",
]);

const offenders = runRgLines(
  "rg -n \"from \\\"\\\\./check-detected-spell-v2\\\\.mjs\\\"\" tools/rule-engine-v2"
)
  .map((line) => line.split(":")[0])
  .filter(Boolean)
  .filter((rel) => !ALLOW.has(rel));

if (offenders.length) {
  failCheck(
    CHECK_TAG,
    `legacy check-detected-spell-v2 imports outside compatibility shim: ${[...new Set(offenders)].join(", ")}`
  );
}

reportCheckPass(
  CHECK_TAG,
  "check utilities use canonical check-detected-word-v2 surface (spell utility remains shim-only)"
);
