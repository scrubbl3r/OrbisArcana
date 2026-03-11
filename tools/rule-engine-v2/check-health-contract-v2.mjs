import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(msg) {
  console.error(`[health-contract:v2] FAIL: ${msg}`);
  process.exit(1);
}

let health = null;
try {
  const healthPath = resolve(process.cwd(), "docs/rule-engine-v2.health.json");
  health = JSON.parse(readFileSync(healthPath, "utf8"));
} catch (err) {
  fail(`unable to read docs/rule-engine-v2.health.json (${err?.message || err})`);
}

if (health.spellbookOk !== true) fail("spellbookOk must be true");
if (health.interactionsOk !== true) fail("interactionsOk must be true");
if (health.bootstrapUsesV2Adapter !== true) fail("bootstrapUsesV2Adapter must be true");
if (health.projectionRulesOnly !== true) fail("projectionRulesOnly must be true");
if (!Array.isArray(health.driftRuleIds)) fail("driftRuleIds must be an array");
if (health.driftRuleIds.length !== 0) fail(`driftRuleIds must be empty (got ${health.driftRuleIds.join(", ")})`);

console.log("[health-contract:v2] PASS: health contract is valid");
