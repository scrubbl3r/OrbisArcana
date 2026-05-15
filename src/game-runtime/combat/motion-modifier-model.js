import { COMBAT_EFFECT_MOTION_MODIFIER } from "./combat-constants.js";

function finiteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeMotionModifierEffect(effect = {}) {
  return Object.freeze({
    kind: COMBAT_EFFECT_MOTION_MODIFIER,
    modifierId: String(effect.modifierId || effect.id || "combat-motion-modifier"),
    sourceEntityId: String(effect.sourceEntityId || effect.source || "unknown"),
    targetEntityId: String(effect.targetEntityId || effect.target || ""),
    liftMultiplier: finiteNumber(effect.liftMultiplier, 1),
    liftPenalty: finiteNumber(effect.liftPenalty, 0),
    dragMultiplier: finiteNumber(effect.dragMultiplier, 1),
    thrustMultiplier: finiteNumber(effect.thrustMultiplier, 1),
    durationMs: Math.max(0, finiteNumber(effect.durationMs, 0)),
    atMs: finiteNumber(effect.atMs, Date.now()),
    tags: Object.freeze(Array.isArray(effect.tags) ? effect.tags.slice() : []),
    meta: Object.freeze({ ...(effect.meta || {}) }),
  });
}

