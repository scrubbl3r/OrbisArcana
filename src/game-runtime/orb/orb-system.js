import {
  EVT_ORB_IMPACT_DETECTED,
  EVT_ORB_DAMAGE_BLOCKED,
  EVT_ORB_DAMAGE_APPLIED,
  EVT_ORB_HEALTH_CHANGED,
  EVT_ORB_DIED,
  EVT_ORB_SHATTER_STARTED,
  EVT_ORB_HEAL_BLOCKED,
  EVT_ORB_HEALED,
  EVT_ORB_REVIVED,
  EVT_COMBAT_DAMAGE_REQUESTED,
  EVT_COMBAT_DAMAGE_APPLIED,
  EVT_COMBAT_DAMAGE_BLOCKED,
  EVT_COMBAT_ENTITY_DIED,
} from "../../contracts/events.js";
import {
  COMBAT_ENTITY_ORB,
  DAMAGE_TYPE_IMPACT,
} from "../combat/combat-constants.js";
import { normalizeDamageEffect, normalizeHealEffect } from "../combat/damage-model.js";
import { createHealthPool } from "../combat/health-pool.js";
import { createOrbLifeSeed, resolveOrbLifeSeed } from "../../state/orb-life-instance.js";

function deriveHpLifecycleState({
  health = 0,
  maxHealth = 1,
  alive = true,
  lifeId = 1,
} = {}) {
  const resolvedMaxHealth = Math.max(1, Math.floor(Number(maxHealth) || 1));
  const resolvedHealth = Math.max(0, Math.min(resolvedMaxHealth, Math.floor(Number(health) || 0)));
  const hitsTaken = resolvedMaxHealth - resolvedHealth;
  return Object.freeze({
    maxHits: resolvedMaxHealth,
    hitsTaken,
    hitsRemaining: resolvedHealth,
    damageRatio: resolvedMaxHealth > 0 ? hitsTaken / resolvedMaxHealth : 1,
    dead: !alive || resolvedHealth <= 0,
    lifeId: Math.max(1, Math.floor(Number(lifeId) || 1)),
  });
}

export function createOrbSystem({ gameState, eventBus }) {
  if (!gameState || !gameState.orb) throw new Error('createOrbSystem requires gameState.orb');
  if (!eventBus || typeof eventBus.emit !== 'function') throw new Error('createOrbSystem requires eventBus.emit');
  const orb = gameState.orb;
  orb.maxHealth = Math.max(1, Math.floor(Number(orb.maxHealth) || 1000));
  orb.health = Math.max(0, Math.min(orb.maxHealth, Number(orb.health) || orb.maxHealth));
  orb.maxHits = orb.maxHealth;
  if (!Number.isFinite(Number(orb.collisionDamage))) {
    orb.collisionDamage = Math.ceil(orb.maxHealth / 3);
  }
  const healthPool = createHealthPool({
    maxHp: orb.maxHealth,
    hp: orb.health,
    alive: orb.alive,
  });
  orb.lifeId = Math.max(1, Math.floor(Number(orb.lifeId) || 1));
  orb.fractureSeed = resolveOrbLifeSeed(orb.fractureSeed, createOrbLifeSeed());

  function syncLifecycleToOrb() {
    const snapshot = deriveHpLifecycleState({
      health: orb.health,
      maxHealth: orb.maxHealth,
      alive: orb.alive,
      lifeId: orb.lifeId,
    });
    orb.maxHits = snapshot.maxHits;
    orb.hitsTaken = snapshot.hitsTaken;
    orb.hitsRemaining = snapshot.hitsRemaining;
    return snapshot;
  }

  function syncHealthToOrb() {
    const snapshot = healthPool.getState();
    orb.maxHealth = snapshot.maxHp;
    orb.health = snapshot.hp;
    orb.alive = snapshot.alive;
    syncLifecycleToOrb();
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
      cause: DAMAGE_TYPE_IMPACT,
      damageType: DAMAGE_TYPE_IMPACT,
      impact,
    });
  }

  function applyDamage(command = {}) {
    const atMs = nowFrom(command);
    const damageEffect = normalizeDamageEffect({
      ...command,
      atMs,
      amount: command.amount,
      sourceEntityId: command.sourceEntityId || command.source || "unknown",
      targetEntityId: COMBAT_ENTITY_ORB,
    });
    const amount = damageEffect.amount;
    const source = damageEffect.sourceEntityId;

    eventBus.emit(EVT_COMBAT_DAMAGE_REQUESTED, damageEffect);

    if (!orb.alive) {
      eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, { reason: 'dead', amount, source, atMs });
      eventBus.emit(EVT_COMBAT_DAMAGE_BLOCKED, { ...damageEffect, reason: "dead" });
      return { applied: false, reason: 'dead' };
    }

    if (amount <= 0) {
      eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, { reason: 'invalid', amount, source, atMs });
      eventBus.emit(EVT_COMBAT_DAMAGE_BLOCKED, { ...damageEffect, reason: "invalid" });
      return { applied: false, reason: 'invalid' };
    }

    const healthBefore = orb.health;
    const combatResult = healthPool.applyDamage(amount);
    syncHealthToOrb();
    const lifecycleState = syncLifecycleToOrb();
    orb.lastDamageAtMs = atMs;
    orb.invulnUntilMs = atMs + Number(orb.collisionCooldownMs || 0);
    const appliedAmount = combatResult.amountApplied || (healthBefore - orb.health);

    eventBus.emit(EVT_ORB_DAMAGE_APPLIED, {
      amount: appliedAmount,
      healthBefore,
      healthAfter: orb.health,
      health: orb.health,
      maxHealth: orb.maxHealth,
      max: orb.maxHealth,
      hitsTaken: orb.hitsTaken,
      maxHits: lifecycleState.maxHits,
      hitsRemaining: lifecycleState.hitsRemaining,
      damageRatio: lifecycleState.damageRatio,
      lifeId: lifecycleState.lifeId,
      fractureSeed: orb.fractureSeed,
      source,
      impact: command.impact,
      cause: damageEffect.cause,
      atMs,
    });
    eventBus.emit(EVT_COMBAT_DAMAGE_APPLIED, {
      ...damageEffect,
      amount: appliedAmount,
      healthBefore,
      healthAfter: orb.health,
      maxHealth: orb.maxHealth,
      targetAlive: orb.alive,
    });

    eventBus.emit(EVT_ORB_HEALTH_CHANGED, {
      from: healthBefore,
      to: orb.health,
      health: orb.health,
      max: orb.maxHealth,
      maxHealth: orb.maxHealth,
      hitsTaken: lifecycleState.hitsTaken,
      maxHits: lifecycleState.maxHits,
      hitsRemaining: lifecycleState.hitsRemaining,
      damageRatio: lifecycleState.damageRatio,
      lifeId: lifecycleState.lifeId,
      fractureSeed: orb.fractureSeed,
      atMs,
    });

    if (combatResult.died || orb.health === 0) {
      orb.deathAtMs = atMs;
      const deathState = syncLifecycleToOrb();
      eventBus.emit(EVT_ORB_DIED, {
        atMs,
        cause: damageEffect.cause,
        hitsTaken: orb.hitsTaken,
        maxHits: deathState.maxHits,
        lifeId: deathState.lifeId,
        fractureSeed: orb.fractureSeed,
      });
      eventBus.emit(EVT_COMBAT_ENTITY_DIED, {
        entityId: COMBAT_ENTITY_ORB,
        sourceEntityId: source,
        cause: damageEffect.cause,
        atMs,
      });
      eventBus.emit(EVT_ORB_SHATTER_STARTED, {
        atMs,
        pieceCount: command.pieceCount || 12,
        seed: resolveOrbLifeSeed(command.seed, orb.fractureSeed),
        lifeId: deathState.lifeId,
        fractureSeed: orb.fractureSeed,
      });
    }

    return { applied: true, health: orb.health };
  }

  function applyHeal(command = {}) {
    const atMs = nowFrom(command);
    const healEffect = normalizeHealEffect({
      ...command,
      atMs,
      sourceEntityId: command.sourceEntityId || command.source || "unknown",
      targetEntityId: COMBAT_ENTITY_ORB,
    });
    const amount = healEffect.amount;
    const source = healEffect.sourceEntityId;

    if (!orb.alive) {
      eventBus.emit(EVT_ORB_HEAL_BLOCKED, { reason: 'dead', amount, source, atMs });
      return { applied: false, reason: 'dead' };
    }

    if (amount <= 0) {
      eventBus.emit(EVT_ORB_HEAL_BLOCKED, { reason: 'invalid', amount, source, atMs });
      return { applied: false, reason: 'invalid' };
    }

    const before = orb.health;
    const healResult = healthPool.applyHeal(amount);
    syncHealthToOrb();
    orb.lastHealAtMs = atMs;
    const appliedAmount = healResult.amountApplied || (orb.health - before);

    if (appliedAmount <= 0) {
      eventBus.emit(EVT_ORB_HEAL_BLOCKED, { reason: 'full', amount, source, atMs });
      return { applied: false, reason: 'full' };
    }

    const lifecycleState = syncLifecycleToOrb();

    eventBus.emit(EVT_ORB_HEALED, {
      amountApplied: appliedAmount,
      healthBefore: before,
      healthAfter: orb.health,
      health: orb.health,
      maxHealth: orb.maxHealth,
      max: orb.maxHealth,
      hitsTaken: lifecycleState.hitsTaken,
      maxHits: lifecycleState.maxHits,
      hitsRemaining: lifecycleState.hitsRemaining,
      damageRatio: lifecycleState.damageRatio,
      lifeId: lifecycleState.lifeId,
      fractureSeed: orb.fractureSeed,
      hitsRemoved: appliedAmount,
      source,
      atMs,
    });

    eventBus.emit(EVT_ORB_HEALTH_CHANGED, {
      from: before,
      to: orb.health,
      health: orb.health,
      max: orb.maxHealth,
      maxHealth: orb.maxHealth,
      hitsTaken: lifecycleState.hitsTaken,
      maxHits: lifecycleState.maxHits,
      hitsRemaining: lifecycleState.hitsRemaining,
      damageRatio: lifecycleState.damageRatio,
      lifeId: lifecycleState.lifeId,
      fractureSeed: orb.fractureSeed,
      atMs,
    });

    return { applied: true, health: orb.health };
  }

  function revive(command = {}) {
    const atMs = nowFrom(command);
    const reviveHealth = clampHealth(command.health == null ? orb.maxHealth : command.health, orb.maxHealth);
    const before = orb.health;

    orb.alive = reviveHealth > 0;
    healthPool.reset({ hp: reviveHealth, maxHp: orb.maxHealth });
    syncHealthToOrb();
    orb.deathAtMs = null;
    orb.lastDamageAtMs = -Infinity;
    orb.invulnUntilMs = 0;
    orb.lifeId = Math.max(1, Math.floor(Number(orb.lifeId) || 1)) + 1;
    orb.fractureSeed = createOrbLifeSeed();
    syncHealthToOrb();
    const lifecycleState = syncLifecycleToOrb();

    eventBus.emit(EVT_ORB_REVIVED, {
      health: orb.health,
      maxHealth: orb.maxHealth,
      max: orb.maxHealth,
      atMs,
      lifeId: lifecycleState.lifeId,
      maxHits: lifecycleState.maxHits,
      hitsTaken: lifecycleState.hitsTaken,
      hitsRemaining: lifecycleState.hitsRemaining,
      damageRatio: lifecycleState.damageRatio,
      fractureSeed: orb.fractureSeed,
    });
    eventBus.emit(EVT_ORB_HEALTH_CHANGED, {
      from: before,
      to: orb.health,
      health: orb.health,
      max: orb.maxHealth,
      maxHealth: orb.maxHealth,
      hitsTaken: lifecycleState.hitsTaken,
      maxHits: lifecycleState.maxHits,
      hitsRemaining: lifecycleState.hitsRemaining,
      damageRatio: lifecycleState.damageRatio,
      lifeId: lifecycleState.lifeId,
      fractureSeed: orb.fractureSeed,
      atMs,
    });

    return { revived: orb.alive, health: orb.health };
  }

  return {
    tick,
    applyImpact,
    applyDamage,
    applyHeal,
    revive,
    getLifecycleState: () => syncLifecycleToOrb(),
  };
}
