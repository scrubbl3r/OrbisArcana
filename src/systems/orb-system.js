export function createOrbSystem({ gameState, eventBus }) {
  if (!gameState || !gameState.orb) throw new Error('createOrbSystem requires gameState.orb');
  if (!eventBus || typeof eventBus.emit !== 'function') throw new Error('createOrbSystem requires eventBus.emit');

  function nowFrom(command) {
    if (command && Number.isFinite(command.atMs)) return Number(command.atMs);
    if (Number.isFinite(gameState.nowMs)) return Number(gameState.nowMs);
    return Date.now();
  }

  function clampHealth(h, maxHealth) {
    return Math.max(0, Math.min(maxHealth, Math.floor(Number(h) || 0)));
  }

  function visualFromHealth(health) {
    if (health <= 0) return 'shattered';
    if (health <= 100) return 'crack_2';
    if (health <= 200) return 'crack_1';
    return 'pristine';
  }

  function updateVisualState(atMs) {
    const orb = gameState.orb;
    const prev = orb.visualState;
    const next = visualFromHealth(orb.health);
    if (prev === next) return;
    orb.visualState = next;
    eventBus.emit('orb.visual_state_changed', {
      from: prev,
      to: next,
      health: orb.health,
      atMs,
    });
  }

  function resolveDamageAmount(command) {
    const orb = gameState.orb;
    if (command && Number.isFinite(command.amount)) {
      return Math.max(0, Math.floor(Number(command.amount)));
    }
    return orb.collisionDamage;
  }

  function resolveThreshold(command) {
    const orb = gameState.orb;
    if (command && Number.isFinite(command.threshold)) return Number(command.threshold);
    return orb.collisionThreshold;
  }

  function tick(nowMs) {
    gameState.nowMs = Number.isFinite(nowMs) ? Number(nowMs) : gameState.nowMs;
  }

  function applyImpact(command = {}) {
    const orb = gameState.orb;
    const atMs = nowFrom(command);
    const impact = Number(command.impact) || 0;
    const threshold = resolveThreshold(command);
    const source = command.source || 'unknown';

    eventBus.emit('orb.impact_detected', { impact, threshold, source, atMs });

    if (!orb.alive) {
      eventBus.emit('orb.damage_blocked', { reason: 'dead', impact, source, atMs });
      return { applied: false, reason: 'dead' };
    }

    if ((atMs - Number(orb.lastDamageAtMs || -Infinity)) < Number(orb.collisionCooldownMs || 0)) {
      eventBus.emit('orb.damage_blocked', { reason: 'cooldown', impact, source, atMs });
      return { applied: false, reason: 'cooldown' };
    }

    if (impact < threshold) {
      eventBus.emit('orb.damage_blocked', { reason: 'below_threshold', impact, source, atMs });
      return { applied: false, reason: 'below_threshold' };
    }

    return applyDamage({
      amount: resolveDamageAmount(command),
      source,
      atMs,
      cause: 'impact',
      impact,
    });
  }

  function applyDamage(command = {}) {
    const orb = gameState.orb;
    const atMs = nowFrom(command);
    const amount = Math.max(0, Math.floor(Number(command.amount) || 0));
    const source = command.source || 'unknown';

    if (!orb.alive) {
      eventBus.emit('orb.damage_blocked', { reason: 'dead', amount, source, atMs });
      return { applied: false, reason: 'dead' };
    }

    if (amount <= 0) {
      eventBus.emit('orb.damage_blocked', { reason: 'invalid', amount, source, atMs });
      return { applied: false, reason: 'invalid' };
    }

    const healthBefore = orb.health;
    orb.health = clampHealth(orb.health - amount, orb.maxHealth);
    orb.hitsTaken = Math.max(0, (Number(orb.hitsTaken) || 0) + 1);
    orb.lastDamageAtMs = atMs;
    orb.invulnUntilMs = atMs + Number(orb.collisionCooldownMs || 0);

    eventBus.emit('orb.damage_applied', {
      amount,
      healthBefore,
      healthAfter: orb.health,
      hitsTaken: orb.hitsTaken,
      source,
      impact: command.impact,
      cause: command.cause || 'generic',
      atMs,
    });

    eventBus.emit('orb.health_changed', {
      from: healthBefore,
      to: orb.health,
      max: orb.maxHealth,
      atMs,
    });

    updateVisualState(atMs);

    if (orb.health === 0) {
      orb.alive = false;
      orb.deathAtMs = atMs;
      eventBus.emit('orb.died', {
        atMs,
        cause: command.cause || 'generic',
        hitsTaken: orb.hitsTaken,
      });
      eventBus.emit('orb.shatter_started', {
        atMs,
        pieceCount: command.pieceCount || 12,
        seed: command.seed || ((Math.random() * 1e9) | 0),
      });
    }

    return { applied: true, health: orb.health };
  }

  function applyHeal(command = {}) {
    const orb = gameState.orb;
    const atMs = nowFrom(command);
    const amount = Math.max(0, Math.floor(Number(command.amount) || 0));
    const source = command.source || 'unknown';

    if (!orb.alive) {
      eventBus.emit('orb.heal_blocked', { reason: 'dead', amount, source, atMs });
      return { applied: false, reason: 'dead' };
    }

    if (amount <= 0) {
      eventBus.emit('orb.heal_blocked', { reason: 'invalid', amount, source, atMs });
      return { applied: false, reason: 'invalid' };
    }

    const before = orb.health;
    orb.health = clampHealth(orb.health + amount, orb.maxHealth);
    orb.lastHealAtMs = atMs;
    const appliedAmount = orb.health - before;

    if (appliedAmount <= 0) {
      eventBus.emit('orb.heal_blocked', { reason: 'full', amount, source, atMs });
      return { applied: false, reason: 'full' };
    }

    eventBus.emit('orb.healed', {
      amountApplied: appliedAmount,
      healthBefore: before,
      healthAfter: orb.health,
      source,
      atMs,
    });

    eventBus.emit('orb.health_changed', {
      from: before,
      to: orb.health,
      max: orb.maxHealth,
      atMs,
    });

    updateVisualState(atMs);
    return { applied: true, health: orb.health };
  }

  function revive(command = {}) {
    const orb = gameState.orb;
    const atMs = nowFrom(command);
    const reviveHealth = clampHealth(command.health == null ? orb.maxHealth : command.health, orb.maxHealth);
    const before = orb.health;

    orb.alive = reviveHealth > 0;
    orb.health = reviveHealth;
    orb.deathAtMs = null;
    orb.lastDamageAtMs = -Infinity;
    orb.invulnUntilMs = 0;
    orb.hitsTaken = 0;

    eventBus.emit('orb.revived', { health: orb.health, atMs });
    eventBus.emit('orb.health_changed', {
      from: before,
      to: orb.health,
      max: orb.maxHealth,
      atMs,
    });

    updateVisualState(atMs);
    return { revived: true, health: orb.health };
  }

  return {
    tick,
    applyImpact,
    applyDamage,
    applyHeal,
    revive,
  };
}
