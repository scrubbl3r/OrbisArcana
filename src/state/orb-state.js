// Orb state model scaffold.
// No health/damage behavior implemented yet by design.

export function createOrbState(config = {}) {
  return {
    // Core identity
    id: config.id || 'orb-1',

    // Planned combat/lifecycle fields (inactive until behavior pass)
    maxHealth: config.maxHealth ?? 100,
    health: config.health ?? 100,
    alive: config.alive ?? true,
    invulnUntilMs: config.invulnUntilMs ?? 0,
    deathAtMs: config.deathAtMs ?? null,
    lastDamageAtMs: config.lastDamageAtMs ?? null,
    lastHealAtMs: config.lastHealAtMs ?? null,

    // Extensible status map for future effects
    statuses: { ...(config.statuses || {}) },
  };
}

export function cloneOrbState(state) {
  return {
    ...state,
    statuses: { ...(state && state.statuses ? state.statuses : {}) },
  };
}
