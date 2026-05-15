import { createOrbLifeSeed, resolveOrbLifeSeed } from "./orb-life-instance.js";

export function createOrbState(config = {}) {
  const maxHealth = Number.isFinite(config.maxHealth) ? Math.max(1, Math.floor(config.maxHealth)) : 1000;
  const health = Number.isFinite(config.health) ? Math.max(0, Math.min(maxHealth, Math.floor(config.health))) : maxHealth;
  const alive = config.alive == null ? (health > 0) : !!config.alive;

  return {
    id: config.id || 'orb-1',

    maxHealth,
    health,
    alive,

    // Core collision/damage tuning.
    collisionThreshold: Number.isFinite(config.collisionThreshold) ? Number(config.collisionThreshold) : 1.0,
    collisionDamage: Number.isFinite(config.collisionDamage) ? Math.max(1, Math.floor(config.collisionDamage)) : Math.ceil(maxHealth / 3),
    collisionCooldownMs: Number.isFinite(config.collisionCooldownMs) ? Math.max(0, Math.floor(config.collisionCooldownMs)) : 250,

    // Derived gameplay/status fields.
    hitsTaken: Number.isFinite(config.hitsTaken) ? Math.max(0, Math.floor(config.hitsTaken)) : 0,
    lifeId: Number.isFinite(config.lifeId) ? Math.max(1, Math.floor(config.lifeId)) : 1,
    fractureSeed: resolveOrbLifeSeed(config.fractureSeed, createOrbLifeSeed()),
    visualState: config.visualState || (health <= 0 ? 'shattered' : health <= maxHealth / 3 ? 'crack_2' : health <= maxHealth * 2 / 3 ? 'crack_1' : 'pristine'),

    invulnUntilMs: config.invulnUntilMs ?? 0,
    deathAtMs: config.deathAtMs ?? null,
    lastDamageAtMs: config.lastDamageAtMs ?? -Infinity,
    lastHealAtMs: config.lastHealAtMs ?? null,

    statuses: { ...(config.statuses || {}) },
  };
}

export function cloneOrbState(state) {
  return {
    ...state,
    statuses: { ...(state && state.statuses ? state.statuses : {}) },
  };
}
