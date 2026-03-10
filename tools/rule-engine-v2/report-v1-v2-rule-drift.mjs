import { buildRulesV1FromInteractionsV2, INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { SPELL_RULES_V1_STATIC } from "../../src/content/spell-rules/spell-rules-v1.js";

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

const projected = buildRulesV1FromInteractionsV2(INTERACTIONS_V2);
const legacy = Array.isArray(SPELL_RULES_V1_STATIC) ? SPELL_RULES_V1_STATIC : [];

const projectedById = byId(projected);
const legacyById = byId(legacy);

const projectedIds = new Set(Object.keys(projectedById));
const legacyIds = new Set(Object.keys(legacyById));

const onlyProjected = [...projectedIds].filter((id) => !legacyIds.has(id)).sort();
const onlyLegacy = [...legacyIds].filter((id) => !projectedIds.has(id)).sort();
const shared = [...projectedIds].filter((id) => legacyIds.has(id)).sort();

const changed = [];
for (const id of shared) {
  const a = stable(projectedById[id]);
  const b = stable(legacyById[id]);
  if (a !== b) changed.push(id);
}

console.log("[v1-v2-drift] projected rules:", projected.length);
console.log("[v1-v2-drift] legacy static rules:", legacy.length);
console.log("[v1-v2-drift] only in projected:", onlyProjected.length);
if (onlyProjected.length) console.log("  ", onlyProjected.join(", "));
console.log("[v1-v2-drift] only in legacy:", onlyLegacy.length);
if (onlyLegacy.length) console.log("  ", onlyLegacy.join(", "));
console.log("[v1-v2-drift] changed shared rules:", changed.length);
if (changed.length) console.log("  ", changed.join(", "));

if (changed.length) {
  for (const id of changed) {
    console.log(`\n--- rule ${id} (projected) ---`);
    console.log(stable(projectedById[id]));
    console.log(`--- rule ${id} (legacy static) ---`);
    console.log(stable(legacyById[id]));
  }
}

