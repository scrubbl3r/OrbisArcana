import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function fail(msg) {
  console.error(`[ready:v2] FAIL: ${msg}`);
  process.exit(1);
}

const doctor = spawnSync(process.execPath, ["tools/rule-engine-v2/doctor-v2.mjs"], { stdio: "inherit" });
if (doctor.status !== 0) process.exit(doctor.status || 1);

const healthPath = resolve(process.cwd(), "docs/rule-engine-v2.health.json");
const health = JSON.parse(readFileSync(healthPath, "utf8"));

if (health.spellbookOk !== true) fail("spellbookOk must be true");
if (health.interactionsOk !== true) fail("interactionsOk must be true");
if (health.bootstrapUsesV2Adapter !== true) fail("bootstrapUsesV2Adapter must be true");
if (health.legacyBridgeUsesV2Rules !== true) fail("legacyBridgeUsesV2Rules must be true");
if (!Array.isArray(health.driftRuleIds)) fail("driftRuleIds must be an array");
if (health.driftRuleIds.length !== 0) fail(`driftRuleIds must be empty (got ${health.driftRuleIds.join(", ")})`);

console.log("[ready:v2] PASS: cutover health is green");
