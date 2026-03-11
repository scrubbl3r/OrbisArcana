import {
  buildRuleEngineFromInteractionsV2,
  buildRulesFromInteractionsV2,
  INTERACTIONS_V2,
} from "../../src/content/interactions-v2/index.js";

function stable(v) {
  return JSON.stringify(v, null, 2);
}

function byId(arr) {
  const out = Object.create(null);
  for (const item of Array.isArray(arr) ? arr : []) {
    const id = String(item && item.id || "").trim();
    if (!id) continue;
    out[id] = item;
  }
  return out;
}

const projected = buildRulesFromInteractionsV2(INTERACTIONS_V2);
const runtimeProjected = buildRuleEngineFromInteractionsV2({
  interactionsV2: INTERACTIONS_V2,
  baseRuleEngine: { rules: [] },
});
const runtime = Array.isArray(runtimeProjected?.rules) ? runtimeProjected.rules : [];

const projectedById = byId(projected);
const runtimeById = byId(runtime);

const projectedIds = new Set(Object.keys(projectedById));
const runtimeIds = new Set(Object.keys(runtimeById));

const onlyProjected = [...projectedIds].filter((id) => !runtimeIds.has(id)).sort();
const onlyRuntime = [...runtimeIds].filter((id) => !projectedIds.has(id)).sort();
const shared = [...projectedIds].filter((id) => runtimeIds.has(id)).sort();

const changed = [];
for (const id of shared) {
  const a = stable(projectedById[id]);
  const b = stable(runtimeById[id]);
  if (a !== b) changed.push(id);
}

console.log("[rules-v2-drift] projected rules:", projected.length);
console.log("[rules-v2-drift] runtime projected rules:", runtime.length);
console.log("[rules-v2-drift] only in projected:", onlyProjected.length);
if (onlyProjected.length) console.log("  ", onlyProjected.join(", "));
console.log("[rules-v2-drift] only in runtime:", onlyRuntime.length);
if (onlyRuntime.length) console.log("  ", onlyRuntime.join(", "));
console.log("[rules-v2-drift] changed shared rules:", changed.length);
if (changed.length) console.log("  ", changed.join(", "));

if (changed.length) {
  for (const id of changed) {
    console.log(`\n--- rule ${id} (projected) ---`);
    console.log(stable(projectedById[id]));
    console.log(`--- rule ${id} (runtime) ---`);
    console.log(stable(runtimeById[id]));
  }
}
