import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { buildRulesV1FromInteractionsV2, INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { RULE_ENGINE_MASTER_CONTROL } from "../../src/content/spell-rules/index.js";

function runPreSmoke() {
  const res = spawnSync(process.execPath, ["tools/rule-engine-v2/pre-smoke-check.mjs"], { stdio: "inherit" });
  if (res.status !== 0) process.exit(res.status || 1);
}

function computeDrift() {
  const projected = buildRulesV1FromInteractionsV2(INTERACTIONS_V2);
  const projectedById = new Map((Array.isArray(projected) ? projected : []).map((r) => [String(r && r.id || ""), r]));
  const runtimeRules = Array.isArray(RULE_ENGINE_MASTER_CONTROL?.rules)
    ? RULE_ENGINE_MASTER_CONTROL.rules
    : [];
  const runtimeById = new Map(runtimeRules.map((r) => [String(r && r.id || ""), r]));
  const allIds = new Set([...projectedById.keys(), ...runtimeById.keys()].filter(Boolean));
  const driftIds = [];
  for (const id of allIds) {
    const a = JSON.stringify(projectedById.get(id) || null);
    const b = JSON.stringify(runtimeById.get(id) || null);
    if (a !== b) driftIds.push(id);
  }
  return driftIds.sort();
}

function loadSnapshot() {
  const path = resolve(process.cwd(), "docs/effective-interactions-v2.snapshot.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

runPreSmoke();

const driftIds = computeDrift();
const snapshot = loadSnapshot();
const health = {
  schema: "orbis.rule_engine_v2.health",
  generatedAt: new Date().toISOString(),
  spellbookOk: snapshot?.validation?.spellbookV2?.ok === true,
  interactionsOk: snapshot?.validation?.interactionsV2?.ok === true,
  bootstrapUsesV2Adapter: snapshot?.flags?.interactionsV2Bootstrap?.useInReceiverBootstrap === true,
  projectionRulesOnly: true,
  // Legacy compatibility key retained for downstream checks/readers.
  v1RulesProjectionOnly: true,
  interactionsRuleCount: Number(snapshot?.counts?.interactionsV2Rules || 0),
  projectedRuleCount: Number(snapshot?.counts?.projectedRuleEngineV1Rules || 0),
  driftRuleIds: driftIds,
};
const healthPath = resolve(process.cwd(), "docs/rule-engine-v2.health.json");
writeFileSync(healthPath, JSON.stringify(health, null, 2) + "\n", "utf8");

console.log("[doctor:v2] ----");
console.log(`[doctor:v2] spellbook ok: ${snapshot?.validation?.spellbookV2?.ok === true}`);
console.log(`[doctor:v2] interactions ok: ${snapshot?.validation?.interactionsV2?.ok === true}`);
console.log(`[doctor:v2] bootstrap uses v2 adapter: ${snapshot?.flags?.interactionsV2Bootstrap?.useInReceiverBootstrap === true}`);
console.log("[doctor:v2] rules mode: projection_only");
console.log(`[doctor:v2] rules count (interactions/projection): ${snapshot?.counts?.interactionsV2Rules || 0}/${snapshot?.counts?.projectedRuleEngineV1Rules || 0}`);
console.log(`[doctor:v2] runtime-projection drift ids: ${driftIds.length}`);
if (driftIds.length) console.log(`[doctor:v2] drift: ${driftIds.join(", ")}`);
console.log(`[doctor:v2] wrote health: ${healthPath}`);
console.log("[doctor:v2] ----");
