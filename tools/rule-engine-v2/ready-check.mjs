import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";

function fail(msg) {
  console.error(`[ready:v2] FAIL: ${msg}`);
  process.exit(1);
}

const doctor = spawnSync(process.execPath, ["tools/rule-engine-v2/doctor-v2.mjs"], { stdio: "inherit" });
if (doctor.status !== 0) process.exit(doctor.status || 1);

const regressionManifestCheck = spawnSync(process.execPath, ["tools/rule-engine-v2/check-regression-manifest-v2.mjs"], { stdio: "inherit" });
if (regressionManifestCheck.status !== 0) process.exit(regressionManifestCheck.status || 1);

for (const check of REGRESSION_CHECKS_V2) {
  const res = spawnSync(process.execPath, [check.script], { stdio: "inherit" });
  if (res.status !== 0) process.exit(res.status || 1);
}

const contractManifestCheck = spawnSync(process.execPath, ["tools/rule-engine-v2/check-contract-manifest-v2.mjs"], { stdio: "inherit" });
if (contractManifestCheck.status !== 0) process.exit(contractManifestCheck.status || 1);

for (const check of CONTRACT_CHECKS_V2) {
  const res = spawnSync(process.execPath, [check.script], { stdio: "inherit" });
  if (res.status !== 0) process.exit(res.status || 1);
}

const masterControlAuthoringCheck = spawnSync(process.execPath, ["tools/rule-engine-v2/check-master-control-authoring-v2.mjs"], { stdio: "inherit" });
if (masterControlAuthoringCheck.status !== 0) process.exit(masterControlAuthoringCheck.status || 1);

const healthPath = resolve(process.cwd(), "docs/rule-engine-v2.health.json");
const health = JSON.parse(readFileSync(healthPath, "utf8"));

if (health.spellbookOk !== true) fail("spellbookOk must be true");
if (health.interactionsOk !== true) fail("interactionsOk must be true");
if (health.bootstrapUsesV2Adapter !== true) fail("bootstrapUsesV2Adapter must be true");
if (health.projectionRulesOnly !== true) fail("projectionRulesOnly must be true");
if (!Array.isArray(health.driftRuleIds)) fail("driftRuleIds must be an array");
if (health.driftRuleIds.length !== 0) fail(`driftRuleIds must be empty (got ${health.driftRuleIds.join(", ")})`);

console.log("[ready:v2] PASS: cutover health is green");
