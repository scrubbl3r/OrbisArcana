import { resolve } from "node:path";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import {
  buildRuleEngineFromInteractionsV2,
  buildRulesFromInteractionsV2,
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";

function runPreSmoke() {
  const res = runCheckScript("tools/rule-engine-v2/pre-smoke-check.mjs", { stdio: "inherit" });
  if (!res.ok) process.exit(res.status || 1);
}

function computeDrift() {
  const projected = buildRulesFromInteractionsV2(INTERACTIONS_V2);
  const projectedById = new Map((Array.isArray(projected) ? projected : []).map((r) => [String(r && r.id || ""), r]));
  const runtimeProjected = buildRuleEngineFromInteractionsV2({
    interactionsV2: INTERACTIONS_V2,
    // Rule projection parity check does not require policy/override surfaces.
    baseRuleEngine: { rules: [] },
  });
  const runtimeRules = Array.isArray(runtimeProjected?.rules) ? runtimeProjected.rules : [];
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
  return readJsonSafe(resolve(process.cwd(), RULE_ENGINE_V2_DOC_PATHS.effectiveSnapshot));
}

runPreSmoke();

const driftIds = computeDrift();
const snapshot = loadSnapshot();
const projectedRuleCount = Number(snapshot?.counts?.projectedRuleEngineRules ?? 0);
const health = {
  schema: "orbis.rule_engine_v2.health",
  generatedAt: new Date().toISOString(),
  spellbookOk: snapshot?.validation?.spellbookV2?.ok === true,
  interactionsOk: snapshot?.validation?.interactionsV2?.ok === true,
  bootstrapUsesV2Adapter: snapshot?.flags?.interactionsV2Bootstrap?.useInReceiverBootstrap === true,
  projectionRulesOnly: true,
  interactionsRuleCount: Number(snapshot?.counts?.interactionsV2Rules || 0),
  projectedRuleCount,
  driftRuleIds: driftIds,
};
const healthPath = resolve(process.cwd(), RULE_ENGINE_V2_DOC_PATHS.health);
writeJsonFile(healthPath, health);

console.log("[doctor:v2] ----");
console.log(`[doctor:v2] spellbook ok: ${snapshot?.validation?.spellbookV2?.ok === true}`);
console.log(`[doctor:v2] interactions ok: ${snapshot?.validation?.interactionsV2?.ok === true}`);
console.log(`[doctor:v2] bootstrap uses v2 adapter: ${snapshot?.flags?.interactionsV2Bootstrap?.useInReceiverBootstrap === true}`);
console.log("[doctor:v2] rules mode: projection_only");
console.log(`[doctor:v2] rules count (interactions/projection): ${snapshot?.counts?.interactionsV2Rules || 0}/${projectedRuleCount}`);
console.log(`[doctor:v2] runtime-projection drift ids: ${driftIds.length}`);
if (driftIds.length) console.log(`[doctor:v2] drift: ${driftIds.join(", ")}`);
console.log(`[doctor:v2] wrote health: ${healthPath}`);
console.log("[doctor:v2] ----");
