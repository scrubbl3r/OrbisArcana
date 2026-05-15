import {
  COMBAT_EFFECT_DAMAGE,
  DAMAGE_TYPE_GENERIC,
} from "./combat-constants.js";

function finiteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
}

export function normalizeDamageEffect(effect = {}) {
  const amount = Math.max(0, finiteNumber(effect.amount, 0));
  return Object.freeze({
    kind: COMBAT_EFFECT_DAMAGE,
    amount,
    damageType: String(effect.damageType || effect.type || DAMAGE_TYPE_GENERIC),
    sourceEntityId: String(effect.sourceEntityId || effect.source || "unknown"),
    targetEntityId: String(effect.targetEntityId || effect.target || ""),
    cause: String(effect.cause || effect.damageType || effect.type || DAMAGE_TYPE_GENERIC),
    atMs: finiteNumber(effect.atMs, Date.now()),
    tags: Object.freeze(normalizeTags(effect.tags)),
    meta: Object.freeze({ ...(effect.meta || {}) }),
  });
}

export function normalizeHealEffect(effect = {}) {
  const amount = Math.max(0, finiteNumber(effect.amount, 0));
  return Object.freeze({
    kind: "heal",
    amount,
    sourceEntityId: String(effect.sourceEntityId || effect.source || "unknown"),
    targetEntityId: String(effect.targetEntityId || effect.target || ""),
    atMs: finiteNumber(effect.atMs, Date.now()),
    tags: Object.freeze(normalizeTags(effect.tags)),
    meta: Object.freeze({ ...(effect.meta || {}) }),
  });
}

