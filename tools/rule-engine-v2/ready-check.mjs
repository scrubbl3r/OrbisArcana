import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";

function fail(msg) {
  console.error(`[ready:v2] FAIL: ${msg}`);
  process.exit(1);
}

const readyPhasesManifestCheck = runCheckScript("tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs", { stdio: "inherit" });
if (!readyPhasesManifestCheck.ok) process.exit(readyPhasesManifestCheck.status);

for (const phase of READY_PHASES_V2) {
  const res = runCheckScript(phase.script, { stdio: "inherit" });
  if (!res.ok) process.exit(res.status);
}

for (const check of REGRESSION_CHECKS_V2) {
  const res = runCheckScript(check.script, { stdio: "inherit" });
  if (!res.ok) process.exit(res.status);
}

for (const check of CONTRACT_CHECKS_V2) {
  const res = runCheckScript(check.script, { stdio: "inherit" });
  if (!res.ok) process.exit(res.status);
}

const healthPath = resolve(process.cwd(), "docs/rule-engine-v2.health.json");
const health = JSON.parse(readFileSync(healthPath, "utf8"));

if (health.spellbookOk !== true) fail("spellbookOk must be true");
if (health.interactionsOk !== true) fail("interactionsOk must be true");
if (health.bootstrapUsesV2Adapter !== true) fail("bootstrapUsesV2Adapter must be true");
if (health.projectionRulesOnly !== true) fail("projectionRulesOnly must be true");
if (!Array.isArray(health.driftRuleIds)) fail("driftRuleIds must be an array");
if (health.driftRuleIds.length !== 0) fail(`driftRuleIds must be empty (got ${health.driftRuleIds.join(", ")})`);

console.log("[ready:v2] PASS: cutover health is green");
