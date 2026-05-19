import {
  FIRE_VISUAL_PROFILE_SPELLFIRE,
  resolveFireVisualProfile,
} from "./fire-visual-profiles.js";

export const STATUS_EFFECT_BURNING = "burning";

export const BURNING_STATUS_DEFAULT = Object.freeze({
  type: STATUS_EFFECT_BURNING,
  sourceId: "",
  visualProfile: FIRE_VISUAL_PROFILE_SPELLFIRE,
  intensity: 1,
  igniteDamage: 0,
  burnDps: 0,
  burnDurationMs: 0,
  roastDps: 0,
  roastDurationMs: 0,
  tickMs: 250,
});

function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

export function normalizeBurningStatus(input = {}, { atMs = null } = {}) {
  const source = input && typeof input === "object" ? input : {};
  const nowMs = Number.isFinite(Number(atMs))
    ? Number(atMs)
    : (Number.isFinite(Number(source.atMs)) ? Number(source.atMs) : 0);
  return Object.freeze({
    type: STATUS_EFFECT_BURNING,
    sourceId: String(source.sourceId || source.sourceEntityId || BURNING_STATUS_DEFAULT.sourceId),
    visualProfile: resolveFireVisualProfile(source.visualProfile).id,
    intensity: clampNumber(source.intensity, BURNING_STATUS_DEFAULT.intensity, 0, 100),
    igniteDamage: Math.max(0, Number(source.igniteDamage ?? source.amount) || BURNING_STATUS_DEFAULT.igniteDamage),
    burnDps: Math.max(0, Number(source.burnDps) || BURNING_STATUS_DEFAULT.burnDps),
    burnDurationMs: Math.max(0, Number(source.burnDurationMs ?? source.igniteDurationMs) || BURNING_STATUS_DEFAULT.burnDurationMs),
    roastDps: Math.max(0, Number(source.roastDps) || BURNING_STATUS_DEFAULT.roastDps),
    roastDurationMs: Math.max(0, Number(source.roastDurationMs ?? source.durationMs) || BURNING_STATUS_DEFAULT.roastDurationMs),
    tickMs: Math.max(50, Number(source.tickMs) || BURNING_STATUS_DEFAULT.tickMs),
    atMs: nowMs,
  });
}

export function applyBurningStatusToEntity(entity = null, status = {}, nowSec = 0) {
  if (!entity || typeof entity !== "object") return false;
  const burning = normalizeBurningStatus(status, { atMs: nowSec * 1000 });
  const effects = entity.statusEffects && typeof entity.statusEffects === "object"
    ? entity.statusEffects
    : (entity.statusEffects = {});
  const current = effects[STATUS_EFFECT_BURNING] && typeof effects[STATUS_EFFECT_BURNING] === "object"
    ? effects[STATUS_EFFECT_BURNING]
    : {};
  effects[STATUS_EFFECT_BURNING] = {
    type: STATUS_EFFECT_BURNING,
    sourceId: burning.sourceId || current.sourceId || "",
    visualProfile: burning.visualProfile || current.visualProfile || FIRE_VISUAL_PROFILE_SPELLFIRE,
    intensity: Math.max(Number(current.intensity) || 0, burning.intensity),
    burnDps: Math.max(Number(current.burnDps) || 0, burning.burnDps),
    burnUntilSec: Math.max(Number(current.burnUntilSec) || 0, nowSec + burning.burnDurationMs / 1000),
    roastDps: Math.max(Number(current.roastDps) || 0, burning.roastDps),
    roastUntilSec: Math.max(Number(current.roastUntilSec) || 0, nowSec + burning.roastDurationMs / 1000),
    tickMs: burning.tickMs,
  };
  return true;
}

export function tickBurningStatusOnEntity(entity = null, nowSec = 0, dtSec = 0) {
  const burning = entity && entity.statusEffects && entity.statusEffects[STATUS_EFFECT_BURNING];
  if (!burning || typeof burning !== "object") return 0;
  let damage = 0;
  if ((Number(burning.burnUntilSec) || 0) > nowSec) {
    damage += Math.max(0, Number(burning.burnDps) || 0) * dtSec;
  } else {
    burning.burnDps = 0;
  }
  if ((Number(burning.roastUntilSec) || 0) > nowSec) {
    damage += Math.max(0, Number(burning.roastDps) || 0) * dtSec;
  } else {
    burning.roastDps = 0;
  }
  if (damage <= 0) return 0;
  if (Number.isFinite(Number(entity.hp))) {
    entity.hp = Math.max(0, Number(entity.hp) - damage);
  }
  return damage;
}

export function getBurningVisualState(entity = null, nowSec = 0) {
  const burning = entity && entity.statusEffects && entity.statusEffects[STATUS_EFFECT_BURNING];
  const active = !!burning && (
    (Number(burning.burnUntilSec) || 0) > nowSec
    || (Number(burning.roastUntilSec) || 0) > nowSec
  );
  const profile = resolveFireVisualProfile(burning && burning.visualProfile);
  return Object.freeze({
    active,
    profile,
    intensity: active ? Math.max(0, Number(burning.intensity) || 0) : 0,
  });
}

