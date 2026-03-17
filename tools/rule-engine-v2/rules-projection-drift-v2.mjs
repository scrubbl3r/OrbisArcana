import {
  buildRuleEngineFromInteractionsV2,
  buildRulesFromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";

function toRuleMap(rules) {
  const out = new Map();
  for (const rule of Array.isArray(rules) ? rules : []) {
    const id = typeof rule?.id === "string" ? rule.id.trim() : "";
    if (!id) continue;
    out.set(id, rule);
  }
  return out;
}

export function computeProjectionDrift(interactionsV2) {
  const projectedRules = buildRulesFromInteractionsV2(interactionsV2);
  const runtimeProjected = buildRuleEngineFromInteractionsV2({
    interactionsV2,
    baseRuleEngine: { rules: [] },
  });
  const runtimeRules = Array.isArray(runtimeProjected?.rules) ? runtimeProjected.rules : [];

  const projectedById = toRuleMap(projectedRules);
  const runtimeById = toRuleMap(runtimeRules);
  const allIds = new Set([...projectedById.keys(), ...runtimeById.keys()]);
  const onlyProjectedIds = [];
  const onlyRuntimeIds = [];
  const changedIds = [];

  for (const id of allIds) {
    const hasProjected = projectedById.has(id);
    const hasRuntime = runtimeById.has(id);
    if (hasProjected && !hasRuntime) {
      onlyProjectedIds.push(id);
      continue;
    }
    if (!hasProjected && hasRuntime) {
      onlyRuntimeIds.push(id);
      continue;
    }
    const projected = JSON.stringify(projectedById.get(id) ?? null);
    const runtime = JSON.stringify(runtimeById.get(id) ?? null);
    if (projected !== runtime) changedIds.push(id);
  }

  onlyProjectedIds.sort();
  onlyRuntimeIds.sort();
  changedIds.sort();

  return {
    projectedRules,
    runtimeRules,
    projectedById,
    runtimeById,
    onlyProjectedIds,
    onlyRuntimeIds,
    changedIds,
    driftIds: [...onlyProjectedIds, ...onlyRuntimeIds, ...changedIds].sort(),
  };
}
