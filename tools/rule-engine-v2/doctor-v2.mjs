import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { buildRulesV1FromInteractionsV2, INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { SPELL_RULES_V1_STATIC, SPELL_RULES_V1_LEGACY_BRIDGE } from "../../src/content/spell-rules/spell-rules-v1.js";

function runPreSmoke() {
  const res = spawnSync(process.execPath, ["tools/rule-engine-v2/pre-smoke-check.mjs"], { stdio: "inherit" });
  if (res.status !== 0) process.exit(res.status || 1);
}

function computeDrift() {
  const projected = buildRulesV1FromInteractionsV2(INTERACTIONS_V2);
  const projectedById = new Map((Array.isArray(projected) ? projected : []).map((r) => [String(r && r.id || ""), r]));
  const legacyById = new Map((Array.isArray(SPELL_RULES_V1_STATIC) ? SPELL_RULES_V1_STATIC : []).map((r) => [String(r && r.id || ""), r]));
  const allIds = new Set([...projectedById.keys(), ...legacyById.keys()].filter(Boolean));
  const driftIds = [];
  for (const id of allIds) {
    const a = JSON.stringify(projectedById.get(id) || null);
    const b = JSON.stringify(legacyById.get(id) || null);
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

console.log("[doctor:v2] ----");
console.log(`[doctor:v2] spellbook ok: ${snapshot?.validation?.spellbookV2?.ok === true}`);
console.log(`[doctor:v2] interactions ok: ${snapshot?.validation?.interactionsV2?.ok === true}`);
console.log(`[doctor:v2] bootstrap uses v2 adapter: ${snapshot?.flags?.interactionsV2Bootstrap?.useInReceiverBootstrap === true}`);
console.log(`[doctor:v2] legacy bridge uses v2 rules: ${SPELL_RULES_V1_LEGACY_BRIDGE?.useInteractionsV2Rules === true}`);
console.log(`[doctor:v2] rules count (interactions/projection): ${snapshot?.counts?.interactionsV2Rules || 0}/${snapshot?.counts?.projectedRuleEngineV1Rules || 0}`);
console.log(`[doctor:v2] legacy-projection drift ids: ${driftIds.length}`);
if (driftIds.length) console.log(`[doctor:v2] drift: ${driftIds.join(", ")}`);
console.log("[doctor:v2] ----");
