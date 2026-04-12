import {
  EVT_ORB_VISUAL_STATE_CHANGED,
  EVT_ORB_IMPACT_DETECTED,
  EVT_ORB_DAMAGE_BLOCKED,
  EVT_ORB_DAMAGE_APPLIED,
  EVT_ORB_HEALTH_CHANGED,
  EVT_ORB_DIED,
  EVT_ORB_SHATTER_STARTED,
  EVT_ORB_HEAL_BLOCKED,
  EVT_ORB_HEALED,
  EVT_ORB_REVIVED,
} from "../../contracts/events.js";
import { createOrbLifecycle } from "./orb-lifecycle.js";

export function createOrbSystem({ gameState, eventBus }) {
  if (!gameState || !gameState.orb) throw new Error('createOrbSystem requires gameState.orb');
  if (!eventBus || typeof eventBus.emit !== 'function') throw new Error('createOrbSystem requires eventBus.emit');
  const orb = gameState.orb;
  const derivedMaxHits = Math.max(1, Math.round(Number(orb.maxHealth) / Math.max(1, Number(orb.collisionDamage) || 1)));
  const lifecycle = createOrbLifecycle({
    maxHits: Number.isFinite(orb.maxHits) ? Number(orb.maxHits) : derivedMaxHits,
    hitsTaken: Number(orb.hitsTaken) || 0,
    dead: !orb.alive || Number(orb.health) <= 0,
    lifeId: Number(orb.lifeId) || 1,
  });

  function syncLifecycleToOrb() {
    const snapshot = lifecycle.getState();
    orb.maxHits = snapshot.maxHits;
    orb.hitsTaken = snapshot.hitsTaken;
    orb.hitsRemaining = snapshot.hitsRemaining;
    orb.lifeId = snapshot.lifeId;
    return snapshot;
  }

  syncLifecycleToOrb();

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
    const prev = orb.visualState;
    const next = visualFromHealth(orb.health);
    if (prev === next) return;
    orb.visualState = next;
    eventBus.emit(EVT_ORB_VISUAL_STATE_CHANGED, {
      from: prev,
      to: next,
      health: orb.health,
      atMs,
    });
  }

  function resolveDamageAmount(command) {
    if (command && Number.isFinite(command.amount)) {
      return Math.max(0, Math.floor(Number(command.amount)));
    }
    return orb.collisionDamage;
  }

  function resolveThreshold(command) {
    if (command && Number.isFinite(command.threshold)) return Number(command.threshold);
    return orb.collisionThreshold;
  }

  function tick(nowMs) {
    gameState.nowMs = Number.isFinite(nowMs) ? Number(nowMs) : gameState.nowMs;
  }

  function applyImpact(command = {}) {
    const atMs = nowFrom(command);
    const impact = Number(command.impact) || 0;
    const threshold = resolveThreshold(command);
    const source = command.source || 'unknown';

    eventBus.emit(EVT_ORB_IMPACT_DETECTED, { impact, threshold, source, atMs });

    if (!orb.alive) {
      eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, { reason: 'dead', impact, source, atMs });
      return { applied: false, reason: 'dead' };
    }

    if ((atMs - Number(orb.lastDamageAtMs || -Infinity)) < Number(orb.collisionCooldownMs || 0)) {
      eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, { reason: 'cooldown', impact, source, atMs });
      return { applied: false, reason: 'cooldown' };
    }

    if (impact < threshold) {
      eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, { reason: 'below_threshold', impact, source, atMs });
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
    const atMs = nowFrom(command);
    const amount = Math.max(0, Math.floor(Number(command.amount) || 0));
    const source = command.source || 'unknown';

    if (!orb.alive) {
      eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, { reason: 'dead', amount, source, atMs });
      return { applied: false, reason: 'dead' };
    }

    if (amount <= 0) {
      eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, { reason: 'invalid', amount, source, atMs });
      return { applied: false, reason: 'invalid' };
    }

    const healthBefore = orb.health;
    orb.health = clampHealth(orb.health - amount, orb.maxHealth);
    const lifecycleResult = lifecycle.applyHit();
    const lifecycleState = syncLifecycleToOrb();
    orb.lastDamageAtMs = atMs;
    orb.invulnUntilMs = atMs + Number(orb.collisionCooldownMs || 0);

    eventBus.emit(EVT_ORB_DAMAGE_APPLIED, {
      amount,
      healthBefore,
      healthAfter: orb.health,
      hitsTaken: orb.hitsTaken,
      maxHits: lifecycleState.maxHits,
      lifeId: lifecycleState.lifeId,
      source,
      impact: command.impact,
      cause: command.cause || 'generic',
      atMs,
    });

    eventBus.emit(EVT_ORB_HEALTH_CHANGED, {
      from: healthBefore,
      to: orb.health,
      max: orb.maxHealth,
      atMs,
    });

    updateVisualState(atMs);

    if (orb.health === 0) {
      orb.alive = false;
      orb.deathAtMs = atMs;
      const deathState = lifecycleResult && lifecycleResult.died ? lifecycleState : syncLifecycleToOrb();
      lifecycle.markDead();
      syncLifecycleToOrb();
      eventBus.emit(EVT_ORB_DIED, {
        atMs,
        cause: command.cause || 'generic',
        hitsTaken: orb.hitsTaken,
        maxHits: deathState.maxHits,
        lifeId: deathState.lifeId,
      });
      eventBus.emit(EVT_ORB_SHATTER_STARTED, {
        atMs,
        pieceCount: command.pieceCount || 12,
        seed: command.seed || ((Math.random() * 1e9) | 0),
        lifeId: deathState.lifeId,
      });
    }

    return { applied: true, health: orb.health };
  }

  function applyHeal(command = {}) {
    const atMs = nowFrom(command);
    const amount = Math.max(0, Math.floor(Number(command.amount) || 0));
    const source = command.source || 'unknown';

    if (!orb.alive) {
      eventBus.emit(EVT_ORB_HEAL_BLOCKED, { reason: 'dead', amount, source, atMs });
      return { applied: false, reason: 'dead' };
    }

    if (amount <= 0) {
      eventBus.emit(EVT_ORB_HEAL_BLOCKED, { reason: 'invalid', amount, source, atMs });
      return { applied: false, reason: 'invalid' };
    }

    const before = orb.health;
    orb.health = clampHealth(orb.health + amount, orb.maxHealth);
    orb.lastHealAtMs = atMs;
    const appliedAmount = orb.health - before;

    if (appliedAmount <= 0) {
      eventBus.emit(EVT_ORB_HEAL_BLOCKED, { reason: 'full', amount, source, atMs });
      return { applied: false, reason: 'full' };
    }

    const lifecycleResult = lifecycle.applyHeal();
    const lifecycleState = syncLifecycleToOrb();

    eventBus.emit(EVT_ORB_HEALED, {
      amountApplied: appliedAmount,
      healthBefore: before,
      healthAfter: orb.health,
      hitsTaken: lifecycleState.hitsTaken,
      maxHits: lifecycleState.maxHits,
      lifeId: lifecycleState.lifeId,
      hitsRemoved: lifecycleResult && lifecycleResult.amountRemoved ? lifecycleResult.amountRemoved : 0,
      source,
      atMs,
    });

    eventBus.emit(EVT_ORB_HEALTH_CHANGED, {
      from: before,
      to: orb.health,
      max: orb.maxHealth,
      atMs,
    });

    updateVisualState(atMs);
    return { applied: true, health: orb.health };
  }

  function revive(command = {}) {
    const atMs = nowFrom(command);
    const reviveHealth = clampHealth(command.health == null ? orb.maxHealth : command.health, orb.maxHealth);
    const before = orb.health;

    orb.alive = reviveHealth > 0;
    orb.health = reviveHealth;
    orb.deathAtMs = null;
    orb.lastDamageAtMs = -Infinity;
    orb.invulnUntilMs = 0;
    const lifecycleState = lifecycle.resetLife();
    syncLifecycleToOrb();

    eventBus.emit(EVT_ORB_REVIVED, { health: orb.health, atMs, lifeId: lifecycleState.lifeId, maxHits: lifecycleState.maxHits });
    eventBus.emit(EVT_ORB_HEALTH_CHANGED, {
      from: before,
      to: orb.health,
      max: orb.maxHealth,
      atMs,
    });

    updateVisualState(atMs);
    return { revived: orb.alive, health: orb.health };
  }

  return {
    tick,
    applyImpact,
    applyDamage,
    applyHeal,
    revive,
    getLifecycleState: lifecycle.getState,
  };
}
