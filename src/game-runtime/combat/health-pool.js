function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function clampHp(value, maxHp) {
  return Math.max(0, Math.min(maxHp, Number(value) || 0));
}

export function deriveHitBandState({
  hp = 0,
  maxHp = 1,
  maxHits = 3,
} = {}) {
  const resolvedMaxHp = Math.max(1, Number(maxHp) || 1);
  const resolvedMaxHits = Math.max(1, Math.round(Number(maxHits) || 1));
  const resolvedHp = clampHp(hp, resolvedMaxHp);
  if (resolvedHp <= 0) {
    return Object.freeze({
      maxHits: resolvedMaxHits,
      hitsTaken: resolvedMaxHits,
      hitsRemaining: 0,
      damageRatio: 1,
    });
  }
  const damaged = resolvedMaxHp - resolvedHp;
  const hitSize = resolvedMaxHp / resolvedMaxHits;
  const hitsTaken = Math.min(resolvedMaxHits, Math.max(0, Math.floor(damaged / hitSize)));
  return Object.freeze({
    maxHits: resolvedMaxHits,
    hitsTaken,
    hitsRemaining: Math.max(0, resolvedMaxHits - hitsTaken),
    damageRatio: Math.min(1, Math.max(0, damaged / resolvedMaxHp)),
  });
}

export function createHealthPool({
  maxHp = 1000,
  hp = maxHp,
  alive = null,
} = {}) {
  const state = {
    maxHp: Math.max(1, Math.floor(clampNumber(maxHp, 1000, 1))),
    hp: 0,
    alive: true,
  };
  state.hp = clampHp(hp, state.maxHp);
  state.alive = alive == null ? state.hp > 0 : !!alive;
  if (!state.alive) state.hp = 0;

  function snapshot() {
    return Object.freeze({
      maxHp: state.maxHp,
      hp: state.hp,
      alive: state.alive,
      damageRatio: state.maxHp > 0 ? 1 - state.hp / state.maxHp : 1,
    });
  }

  function applyDamage(amount = 0) {
    if (!state.alive) return Object.freeze({ applied: false, reason: "dead", before: snapshot(), after: snapshot(), amountApplied: 0, died: false });
    const damage = Math.max(0, Number(amount) || 0);
    if (damage <= 0) return Object.freeze({ applied: false, reason: "invalid", before: snapshot(), after: snapshot(), amountApplied: 0, died: false });
    const before = snapshot();
    const nextHp = clampHp(state.hp - damage, state.maxHp);
    state.hp = nextHp;
    state.alive = state.hp > 0;
    const after = snapshot();
    return Object.freeze({
      applied: before.hp !== after.hp,
      before,
      after,
      amountApplied: before.hp - after.hp,
      died: before.alive && !after.alive,
    });
  }

  function applyHeal(amount = 0) {
    if (!state.alive) return Object.freeze({ applied: false, reason: "dead", before: snapshot(), after: snapshot(), amountApplied: 0 });
    const healing = Math.max(0, Number(amount) || 0);
    if (healing <= 0) return Object.freeze({ applied: false, reason: "invalid", before: snapshot(), after: snapshot(), amountApplied: 0 });
    const before = snapshot();
    state.hp = clampHp(state.hp + healing, state.maxHp);
    const after = snapshot();
    return Object.freeze({
      applied: before.hp !== after.hp,
      before,
      after,
      amountApplied: after.hp - before.hp,
    });
  }

  function reset({ hp: nextHp = state.maxHp, maxHp: nextMaxHp = state.maxHp } = {}) {
    state.maxHp = Math.max(1, Math.floor(clampNumber(nextMaxHp, state.maxHp, 1)));
    state.hp = clampHp(nextHp, state.maxHp);
    state.alive = state.hp > 0;
    return snapshot();
  }

  return Object.freeze({
    getState: snapshot,
    applyDamage,
    applyHeal,
    reset,
  });
}

