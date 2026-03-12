import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

const CHECK_TAG = "master-control-import-boundary:v2";

function listMatches() {
  return runRgLines(
    "rg -n \"rule-engine-master-control\\\\.js\" src tools --glob '!**/node_modules/**'"
  );
}

const allowed = new Set([
  "src/content/spell-rules/index.js",
  "tools/rule-engine-v2/check-master-control-compat-surface-v2.mjs",
]);

const offenders = [];
for (const line of listMatches()) {
  const file = line.split(":")[0];
  if (!allowed.has(file)) offenders.push(file);
}

if (offenders.length) {
  failCheck(CHECK_TAG, `direct master-control import/path usage outside boundary: ${[...new Set(offenders)].join(", ")}`);
}

reportCheckPass(CHECK_TAG, "master-control file access is boundary-limited");
