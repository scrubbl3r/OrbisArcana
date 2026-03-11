import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function fail(msg) {
  console.error(`[ready:v2] FAIL: ${msg}`);
  process.exit(1);
}

const doctor = spawnSync(process.execPath, ["tools/rule-engine-v2/doctor-v2.mjs"], { stdio: "inherit" });
if (doctor.status !== 0) process.exit(doctor.status || 1);

const shakeRegression = spawnSync(process.execPath, ["tools/rule-engine-v2/check-shake-detonation-regression-v2.mjs"], { stdio: "inherit" });
if (shakeRegression.status !== 0) process.exit(shakeRegression.status || 1);

const wakeLoadRegression = spawnSync(process.execPath, ["tools/rule-engine-v2/check-wake-window-load-regression-v2.mjs"], { stdio: "inherit" });
if (wakeLoadRegression.status !== 0) process.exit(wakeLoadRegression.status || 1);

const immediateOwnershipRegression = spawnSync(process.execPath, ["tools/rule-engine-v2/check-immediate-dispatch-ownership-v2.mjs"], { stdio: "inherit" });
if (immediateOwnershipRegression.status !== 0) process.exit(immediateOwnershipRegression.status || 1);

const flatSpinGatingRegression = spawnSync(process.execPath, ["tools/rule-engine-v2/check-flat-spin-gating-regression-v2.mjs"], { stdio: "inherit" });
if (flatSpinGatingRegression.status !== 0) process.exit(flatSpinGatingRegression.status || 1);

const wakeWindowAxisPrereqRegression = spawnSync(process.execPath, ["tools/rule-engine-v2/check-wake-window-axis-prereq-regression-v2.mjs"], { stdio: "inherit" });
if (wakeWindowAxisPrereqRegression.status !== 0) process.exit(wakeWindowAxisPrereqRegression.status || 1);

const masterControlAuthoringCheck = spawnSync(process.execPath, ["tools/rule-engine-v2/check-master-control-authoring-v2.mjs"], { stdio: "inherit" });
if (masterControlAuthoringCheck.status !== 0) process.exit(masterControlAuthoringCheck.status || 1);

const healthPath = resolve(process.cwd(), "docs/rule-engine-v2.health.json");
const health = JSON.parse(readFileSync(healthPath, "utf8"));

if (health.spellbookOk !== true) fail("spellbookOk must be true");
if (health.interactionsOk !== true) fail("interactionsOk must be true");
if (health.bootstrapUsesV2Adapter !== true) fail("bootstrapUsesV2Adapter must be true");
if (!(health.projectionRulesOnly === true || health.v1RulesProjectionOnly === true)) {
  fail("projectionRulesOnly (or legacy v1RulesProjectionOnly) must be true");
}
if (!Array.isArray(health.driftRuleIds)) fail("driftRuleIds must be an array");
if (health.driftRuleIds.length !== 0) fail(`driftRuleIds must be empty (got ${health.driftRuleIds.join(", ")})`);

console.log("[ready:v2] PASS: cutover health is green");
