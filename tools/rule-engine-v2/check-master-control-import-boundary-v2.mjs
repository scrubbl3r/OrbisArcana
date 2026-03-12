import { execSync } from "node:child_process";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

function listMatches() {
  let out = "";
  try {
    out = execSync(
      "rg -n \"rule-engine-master-control\\\\.js\" src tools --glob '!**/node_modules/**'",
      { cwd: process.cwd(), encoding: "utf8" }
    );
  } catch (err) {
    if (err && typeof err.status === "number" && err.status === 1) {
      return [];
    }
    throw err;
  }
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
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
  failCheck("master-control-import-boundary:v2", `direct master-control import/path usage outside boundary: ${[...new Set(offenders)].join(", ")}`);
}

reportCheckPass("master-control-import-boundary:v2", "master-control file access is boundary-limited");
