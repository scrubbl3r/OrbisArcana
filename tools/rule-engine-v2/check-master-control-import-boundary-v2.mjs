import { execSync } from "node:child_process";

function fail(msg) {
  console.error(`[master-control-import-boundary:v2] FAIL: ${msg}`);
  process.exit(1);
}

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
  fail(`direct master-control import/path usage outside boundary: ${[...new Set(offenders)].join(", ")}`);
}

console.log("[master-control-import-boundary:v2] PASS: master-control file access is boundary-limited");
