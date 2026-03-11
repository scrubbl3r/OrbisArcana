export function createOrbState(config = {}) {
  const maxHealth = Number.isFinite(config.maxHealth) ? Math.max(1, Math.floor(config.maxHealth)) : 300;
  const health = Number.isFinite(config.health) ? Math.max(0, Math.min(maxHealth, Math.floor(config.health))) : maxHealth;
  const alive = config.alive == null ? (health > 0) : !!config.alive;

  return {
    id: config.id || 'orb-1',

    maxHealth,
    health,
    alive,

    // Core collision/damage tuning.
    collisionThreshold: Number.isFinite(config.collisionThreshold) ? Number(config.collisionThreshold) : 1.0,
    collisionDamage: Number.isFinite(config.collisionDamage) ? Math.max(1, Math.floor(config.collisionDamage)) : 100,
    collisionCooldownMs: Number.isFinite(config.collisionCooldownMs) ? Math.max(0, Math.floor(config.collisionCooldownMs)) : 250,

    // Derived gameplay/status fields.
    hitsTaken: Number.isFinite(config.hitsTaken) ? Math.max(0, Math.floor(config.hitsTaken)) : 0,
    visualState: config.visualState || (health <= 0 ? 'shattered' : health <= 100 ? 'crack_2' : health <= 200 ? 'crack_1' : 'pristine'),

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
