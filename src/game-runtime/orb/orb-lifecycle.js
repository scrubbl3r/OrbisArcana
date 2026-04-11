function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

function nextLifeId(current) {
  const n = Number(current);
  if (!Number.isFinite(n) || n < 0) return 1;
  return n + 1;
}

/**
 * Pure orb lifecycle logic.
 *
 * This module intentionally does not know about Voronoi seeds, shard counts,
 * DOM, or VFX recipes. It only answers the gameplay question:
 * "How damaged is the orb in this life?"
 *
 * `lifeId` is the bridge signal for downstream VFX to regenerate any
 * per-life visuals, such as a fresh fracture seed.
 */
export function createOrbLifecycle({
  maxHits = 3,
  lifeId = 1,
  hitsTaken = 0,
  dead = false,
} = {}) {
  const state = {
    maxHits: clampInt(maxHits, 1, 99, 3),
    hitsTaken: 0,
    dead: !!dead,
    lifeId: clampInt(lifeId, 1, Number.MAX_SAFE_INTEGER, 1),
  };

  state.hitsTaken = state.dead
    ? state.maxHits
    : clampInt(hitsTaken, 0, state.maxHits, 0);

  function getState() {
    return {
      maxHits: state.maxHits,
      hitsTaken: state.hitsTaken,
      hitsRemaining: Math.max(0, state.maxHits - state.hitsTaken),
      dead: state.dead,
      lifeId: state.lifeId,
      damageRatio: state.maxHits > 0 ? (state.hitsTaken / state.maxHits) : 0,
    };
  }

  function setMaxHits(nextMaxHits) {
    state.maxHits = clampInt(nextMaxHits, 1, 99, state.maxHits);
    state.hitsTaken = Math.min(state.hitsTaken, state.maxHits);
    if (state.dead) {
      state.hitsTaken = state.maxHits;
    }
    return getState();
  }

  function applyHit({ amount = 1 } = {}) {
    if (state.dead) {
      return { applied: false, reason: "dead", state: getState() };
    }
    const step = clampInt(amount, 1, state.maxHits, 1);
    const before = state.hitsTaken;
    state.hitsTaken = Math.min(state.maxHits, state.hitsTaken + step);
    state.dead = state.hitsTaken >= state.maxHits;
    return {
      applied: state.hitsTaken !== before,
      died: state.dead,
      amountApplied: state.hitsTaken - before,
      state: getState(),
    };
  }

  function applyHeal({ amount = 1 } = {}) {
    if (state.dead) {
      return { applied: false, reason: "dead", state: getState() };
    }
    const step = clampInt(amount, 1, state.maxHits, 1);
    const before = state.hitsTaken;
    state.hitsTaken = Math.max(0, state.hitsTaken - step);
    return {
      applied: state.hitsTaken !== before,
      amountRemoved: before - state.hitsTaken,
      state: getState(),
    };
  }

  function resetLife({ maxHits: nextMaxHits = state.maxHits } = {}) {
    state.maxHits = clampInt(nextMaxHits, 1, 99, state.maxHits);
    state.hitsTaken = 0;
    state.dead = false;
    state.lifeId = nextLifeId(state.lifeId);
    return getState();
  }

  function markDead() {
    state.dead = true;
    state.hitsTaken = state.maxHits;
    return getState();
  }

  return {
    getState,
    setMaxHits,
    applyHit,
    applyHeal,
    resetLife,
    markDead,
  };
}
