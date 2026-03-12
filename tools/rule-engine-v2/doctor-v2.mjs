import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { RULE_ENGINE_V2_SCRIPT_PATHS } from "./script-paths-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import {
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";
import { computeProjectionDrift } from "./rules-projection-drift-v2.mjs";

function runPreSmoke() {
  const res = runCheckScript(RULE_ENGINE_V2_SCRIPT_PATHS.preSmokeCheck, { stdio: "inherit" });
  if (!res.ok) process.exit(res.status || 1);
}

function computeDrift() {
  const drift = computeProjectionDrift(INTERACTIONS_V2);
  return Array.isArray(drift?.driftIds) ? drift.driftIds : [];
}

function loadSnapshot() {
  return readJsonSafe(resolveRuleEngineDocPath("effectiveSnapshot"));
}

runPreSmoke();

const driftIds = computeDrift();
const snapshot = loadSnapshot();
const projectedRuleCount = Number(snapshot?.counts?.projectedRuleEngineRules ?? 0);
const spellbookOk = isTrue(snapshot?.validation?.spellbookV2?.ok);
const interactionsOk = isTrue(snapshot?.validation?.interactionsV2?.ok);
const bootstrapUsesV2Adapter = isTrue(snapshot?.flags?.interactionsV2Bootstrap?.useInReceiverBootstrap);
const health = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.health,
  generatedAt: nowIso(),
  spellbookOk,
  interactionsOk,
  bootstrapUsesV2Adapter,
  projectionRulesOnly: true,
  interactionsRuleCount: Number(snapshot?.counts?.interactionsV2Rules || 0),
  projectedRuleCount,
  driftRuleIds: driftIds,
};
const healthPath = resolveRuleEngineDocPath("health");
writeJsonFile(healthPath, health);

console.log("[doctor:v2] ----");
console.log(`[doctor:v2] spellbook ok: ${spellbookOk}`);
console.log(`[doctor:v2] interactions ok: ${interactionsOk}`);
console.log(`[doctor:v2] bootstrap uses v2 adapter: ${bootstrapUsesV2Adapter}`);
console.log("[doctor:v2] rules mode: projection_only");
console.log(`[doctor:v2] rules count (interactions/projection): ${snapshot?.counts?.interactionsV2Rules || 0}/${projectedRuleCount}`);
console.log(`[doctor:v2] runtime-projection drift ids: ${driftIds.length}`);
if (driftIds.length) console.log(`[doctor:v2] drift: ${driftIds.join(", ")}`);
console.log(`[doctor:v2] wrote health: ${healthPath}`);
console.log("[doctor:v2] ----");
