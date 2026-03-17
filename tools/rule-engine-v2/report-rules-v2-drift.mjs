import { INTERACTIONS_V2 } from "../../src/content/interactions-v2/index.js";
import { computeProjectionDrift } from "./rules-projection-drift-v2.mjs";
import { stringifyJson } from "./stringify-json-v2.mjs";

function stable(v) {
  return stringifyJson(v);
}

function asList(values) {
  return Array.isArray(values) ? values : [];
}

function asMap(values) {
  return values instanceof Map ? values : new Map();
}

const drift = computeProjectionDrift(INTERACTIONS_V2);
const projected = asList(drift?.projectedRules);
const runtime = asList(drift?.runtimeRules);
const onlyProjected = asList(drift?.onlyProjectedIds);
const onlyRuntime = asList(drift?.onlyRuntimeIds);
const changed = asList(drift?.changedIds);
const projectedById = asMap(drift?.projectedById);
const runtimeById = asMap(drift?.runtimeById);

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
    console.log(stable(projectedById.get(id)));
    console.log(`--- rule ${id} (runtime) ---`);
    console.log(stable(runtimeById.get(id)));
  }
}
