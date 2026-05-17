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

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function lerpFloat(from, to, t) {
  return Number(from) + ((Number(to) - Number(from)) * clamp01(t));
}

function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  const resolved = Number.isFinite(numeric) ? numeric : fallback;
  return Math.max(min, Math.min(max, resolved));
}

export function deriveOrbVitalityState({
  health = 0,
  maxHealth = 1,
} = {}) {
  const resolvedMaxHealth = Math.max(1, Number(maxHealth) || 1);
  const resolvedHealth = Math.max(0, Math.min(resolvedMaxHealth, Number(health) || 0));
  const healthRatio = clamp01(resolvedHealth / resolvedMaxHealth);
  return Object.freeze({
    health: resolvedHealth,
    maxHealth: resolvedMaxHealth,
    healthRatio,
    damageRatio: 1 - healthRatio,
    shaderState: Object.freeze({
      luminanceBoost: lerpFloat(1.2, 1.8, healthRatio),
      centerAlpha: lerpFloat(0.013, 0.018, healthRatio),
      spotIntensity: lerpFloat(24, 29, healthRatio),
      spotDistanceBO: lerpFloat(4.2, 4.9, healthRatio),
    }),
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

  function syncVitalityToOrb() {
    const vitality = deriveOrbVitalityState({
      health: orb.health,
      maxHealth: orb.maxHealth,
    });
    orb.vitality = vitality;
    return vitality;
  }

  function syncHealthToOrb() {
    const snapshot = healthPool.getState();
    orb.maxHealth = snapshot.maxHp;
    orb.health = snapshot.hp;
    orb.alive = snapshot.alive;
    syncLifecycleToOrb();
    syncVitalityToOrb();
    return snapshot;
  }

  syncLifecycleToOrb();
  syncVitalityToOrb();

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

  function resolveImpactDamageAmount({
    impact = 0,
    threshold = 0,
  } = {}) {
    const impactValue = Math.max(0, Number(impact) || 0);
    const thresholdValue = Math.max(0, Number(threshold) || 0);
    const overThreshold = Math.max(0, impactValue - thresholdValue);
    if (overThreshold <= 0) return 0;
    const killImpactMultiplier = clampNumber(orb.impactKillImpactMultiplier, 5.5, 0.1, 20);
    const fallbackFullDamageImpact = Math.max(1, Number(orb.impactFullDamageImpact) || 1000);
    const fullDamageImpact = thresholdValue > 0
      ? Math.max(1, thresholdValue * killImpactMultiplier)
      : fallbackFullDamageImpact;
    const severity = clamp01(overThreshold / fullDamageImpact);
    const curve = clampNumber(orb.impactDamageCurve, 1.6, 0.1, 5);
    const minDamage = clampNumber(orb.impactDamageMin, 1, 0, orb.maxHealth);
    const maxDamage = Math.max(minDamage, clampNumber(orb.impactDamageMax, orb.maxHealth, minDamage, orb.maxHealth));
    return Math.max(
      0,
      Math.min(orb.maxHealth, minDamage + ((maxDamage - minDamage) * (severity ** curve)))
    );
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

    const impactDamageAmount = resolveImpactDamageAmount({ impact, threshold });
    return applyDamage({
      amount: impactDamageAmount > 0 ? impactDamageAmount : resolveDamageAmount(command),
      source,
      atMs,
      cause: DAMAGE_TYPE_IMPACT,
      damageType: DAMAGE_TYPE_IMPACT,
      impact,
      rawImpact: command.rawImpact,
      gravityMul: command.gravityMul,
      fallDrag: command.fallDrag,
      impactThreshold: threshold,
      impactDamageAmount,
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
    const vitality = syncVitalityToOrb();
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
      vitality,
      lifeId: lifecycleState.lifeId,
      fractureSeed: orb.fractureSeed,
      source,
      impact: command.impact,
      rawImpact: command.rawImpact,
      gravityMul: command.gravityMul,
      fallDrag: command.fallDrag,
      impactThreshold: command.impactThreshold,
      impactDamageAmount: command.impactDamageAmount,
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
      vitality,
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
    const vitality = syncVitalityToOrb();

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
      vitality,
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
      vitality,
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
    const vitality = syncVitalityToOrb();

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
      vitality,
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
      vitality,
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
