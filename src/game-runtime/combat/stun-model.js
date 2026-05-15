import { COMBAT_EFFECT_STUN } from "./combat-constants.js";

function finiteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeStunEffect(effect = {}) {
  return Object.freeze({
    kind: COMBAT_EFFECT_STUN,
    amount: Math.max(0, finiteNumber(effect.amount, 0)),
    durationMs: Math.max(0, finiteNumber(effect.durationMs, 0)),
    sourceEntityId: String(effect.sourceEntityId || effect.source || "unknown"),
    targetEntityId: String(effect.targetEntityId || effect.target || ""),
    atMs: finiteNumber(effect.atMs, Date.now()),
    tags: Object.freeze(Array.isArray(effect.tags) ? effect.tags.slice() : []),
    meta: Object.freeze({ ...(effect.meta || {}) }),
  });
}

export function resolveStunApplication({
  amount = 0,
  threshold = 1,
  durationMs = 0,
  atMs = Date.now(),
} = {}) {
  const resolvedAmount = Math.max(0, finiteNumber(amount, 0));
  const resolvedThreshold = Math.max(0, finiteNumber(threshold, 1));
  const stunned = resolvedThreshold <= 0 || resolvedAmount >= resolvedThreshold;
  return Object.freeze({
    stunned,
    amount: resolvedAmount,
    threshold: resolvedThreshold,
    stunUntilMs: stunned ? finiteNumber(atMs, Date.now()) + Math.max(0, finiteNumber(durationMs, 0)) : 0,
  });
}

