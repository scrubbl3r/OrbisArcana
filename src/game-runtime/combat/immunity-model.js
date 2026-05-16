import { COMBAT_EFFECT_IMMUNITY } from "./combat-constants.js";

function finiteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeImmunityEffect(effect = {}) {
  const atMs = finiteNumber(effect.atMs, Date.now());
  const durationMs = Math.max(0, finiteNumber(effect.durationMs, 0));
  const untilMs = Math.max(atMs, finiteNumber(effect.untilMs, atMs + durationMs));
  return Object.freeze({
    kind: COMBAT_EFFECT_IMMUNITY,
    immune: effect.immune !== false && untilMs > atMs,
    immunityId: String(effect.immunityId || effect.id || "combat-immunity"),
    sourceEntityId: String(effect.sourceEntityId || effect.source || "unknown"),
    targetEntityId: String(effect.targetEntityId || effect.target || ""),
    durationMs,
    untilMs,
    atMs,
    reason: String(effect.reason || effect.cause || "immunity"),
    tags: Object.freeze(Array.isArray(effect.tags) ? effect.tags.slice() : []),
    meta: Object.freeze({ ...(effect.meta || {}) }),
  });
}
