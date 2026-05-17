import {
  EVT_ORB_DAMAGE_APPLIED,
  EVT_ORB_DIED,
  EVT_ORB_HEALTH_CHANGED,
  EVT_ORB_REVIVED,
  EVT_PICKUP_COLLECTED,
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_RESOURCES_GLOBE_SPENT,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_LOADED,
} from "../../../contracts/events.js";

export function createGameStageDepth3dEventBindings({
  root = null,
  worldGlobe3dRuntime = null,
  orbGlobe3dRuntime = null,
  orbLifecycle3dRuntime = null,
  loadWorldSpawns = () => {},
  onOrbDied = () => {},
  onOrbRevived = () => {},
  scheduleFrame = () => {},
  traceMark = null,
} = {}) {
  const unsubs = [];

  function roundMetric(value, decimals = 1000) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "";
    return String(Math.round(numeric * decimals) / decimals);
  }

  function syncOrbVisualLifecycleState(payload = {}, {
    lifecycleMode = "damage",
  } = {}) {
    if (typeof traceMark === "function") {
      traceMark("orb.shader.lifecycle.input", {
        lifecycleMode,
        health: Number(payload.health ?? payload.to ?? payload.healthAfter),
        maxHealth: Number(payload.maxHealth ?? payload.max),
        hitsTaken: Number(payload.hitsTaken),
        maxHits: Number(payload.maxHits),
        damageRatio: Number(payload.damageRatio),
        lifeId: payload.lifeId,
        fractureSeed: payload.fractureSeed,
        atMs: Number(payload.atMs),
      });
    }
    if (lifecycleMode === "reset") {
      orbLifecycle3dRuntime.reset(payload);
    } else {
      orbLifecycle3dRuntime.syncDamageState(payload);
    }
    if (typeof traceMark === "function") {
      traceMark("orb.shader.lifecycle.synced", {
        lifecycleMode,
        health: Number(payload.health ?? payload.to ?? payload.healthAfter),
        maxHealth: Number(payload.maxHealth ?? payload.max),
        atMs: Number(payload.atMs),
      });
    }
    scheduleFrame();
  }

  function buildOrbVisualLifecyclePayloadFromState(gameState = null, atMs = performance.now()) {
    const orb = gameState && gameState.orb && typeof gameState.orb === "object" ? gameState.orb : null;
    if (!orb) return null;
    const maxHealth = Math.max(1, Number(orb.maxHealth ?? orb.max ?? 1000) || 1000);
    const health = Math.max(0, Math.min(maxHealth, Number(orb.health ?? maxHealth) || 0));
    const maxHits = Math.max(1, Number(orb.maxHits ?? maxHealth) || maxHealth);
    const hitsTaken = Math.max(0, Math.min(maxHits, Number(orb.hitsTaken ?? (maxHealth - health)) || 0));
    const payload = {
      health,
      maxHealth,
      max: maxHealth,
      hitsTaken,
      maxHits,
      hitsRemaining: Math.max(0, maxHits - hitsTaken),
      damageRatio: maxHits > 0 ? hitsTaken / maxHits : 0,
      lifeId: orb.lifeId,
      fractureSeed: orb.fractureSeed,
      atMs,
    };
    return payload;
  }

  function buildDefaultOrbVisualLifecyclePayload(atMs = performance.now()) {
    return {
      health: 1000,
      maxHealth: 1000,
      max: 1000,
      hitsTaken: 0,
      maxHits: 1000,
      hitsRemaining: 1000,
      damageRatio: 0,
      lifeId: "",
      fractureSeed: "",
      atMs,
    };
  }

  function clear() {
    while (unsubs.length) {
      const off = unsubs.pop();
      try { off(); } catch (_) {}
    }
  }

  function bind({ eventBus = null, spawns = [], gameState = null } = {}) {
    const initialPayload = buildOrbVisualLifecyclePayloadFromState(gameState);
    if (typeof traceMark === "function") {
      traceMark("orb.shader.lifecycle.bind", {
        hasEventBus: Boolean(eventBus && typeof eventBus.on === "function"),
        hasGameState: Boolean(gameState && typeof gameState === "object"),
        hasGameStateOrb: Boolean(gameState && gameState.orb && typeof gameState.orb === "object"),
        gameStateKeys: gameState && typeof gameState === "object" ? Object.keys(gameState).slice(0, 20) : [],
        spawnCount: Array.isArray(spawns) ? spawns.length : 0,
        initialPayloadPresent: Boolean(initialPayload),
      });
    }
    if (root && root.dataset) {
      root.dataset.depthGlobe3dBound = eventBus && typeof eventBus.on === "function" ? "true" : "false";
    }
    clear();
    loadWorldSpawns(spawns);
    if (initialPayload) {
      syncOrbVisualLifecycleState(initialPayload);
    } else {
      if (typeof traceMark === "function") {
        traceMark("orb.shader.lifecycle.initial_missing", {
          seededFallback: true,
          reason: gameState && typeof gameState === "object" ? "game_state_missing_orb" : "game_state_missing",
        });
      }
      syncOrbVisualLifecycleState(buildDefaultOrbVisualLifecyclePayload(), { lifecycleMode: "reset" });
    }
    if (!eventBus || typeof eventBus.on !== "function") return;

    unsubs.push(eventBus.on(EVT_PICKUP_COLLECTED, (payload = {}) => {
      worldGlobe3dRuntime.collect(payload);
    }));
    unsubs.push(eventBus.on(EVT_RESOURCES_GLOBE_SPENT, (payload = {}) => {
      worldGlobe3dRuntime.markSpent(payload);
    }));
    unsubs.push(eventBus.on(EVT_RESOURCES_GLOBE_INVENTORY_CHANGED, (payload = {}) => {
      orbGlobe3dRuntime.reconcileInventory(payload.globes || []);
    }));
    unsubs.push(eventBus.on(EVT_ORB_HEALTH_CHANGED, (payload = {}) => {
      if (typeof traceMark === "function") {
        traceMark("orb.shader.lifecycle.health_event", {
          health: Number(payload.health ?? payload.to ?? payload.healthAfter),
          maxHealth: Number(payload.maxHealth ?? payload.max),
          hitsTaken: Number(payload.hitsTaken),
          maxHits: Number(payload.maxHits),
          damageRatio: Number(payload.damageRatio),
          source: String(payload.source || ""),
          cause: String(payload.cause || ""),
          atMs: Number(payload.atMs),
        });
      }
      syncOrbVisualLifecycleState(payload);
    }));
    unsubs.push(eventBus.on(EVT_ORB_DAMAGE_APPLIED, (payload = {}) => {
      if (typeof traceMark === "function") {
        traceMark("orb.damage.applied", {
          amount: roundMetric(payload.amount),
          healthBefore: roundMetric(payload.healthBefore),
          healthAfter: roundMetric(payload.healthAfter),
          maxHealth: roundMetric(payload.maxHealth),
          impact: roundMetric(payload.impact),
          rawImpact: roundMetric(payload.rawImpact),
          impactThreshold: roundMetric(payload.impactThreshold),
          impactDamageAmount: roundMetric(payload.impactDamageAmount),
          gravityMul: roundMetric(payload.gravityMul),
          fallDrag: roundMetric(payload.fallDrag),
          source: String(payload.source || ""),
          cause: String(payload.cause || ""),
          atMs: roundMetric(payload.atMs, 1),
        });
      }
    }));
    unsubs.push(eventBus.on(EVT_VOICE_SPELL_LOADED, (payload = {}) => {
      orbGlobe3dRuntime.load(payload);
    }));
    unsubs.push(eventBus.on(EVT_VOICE_SPELL_CAST, (payload = {}) => {
      orbGlobe3dRuntime.consume(payload);
    }));
    unsubs.push(eventBus.on(EVT_ORB_DIED, (payload = {}) => {
      if (typeof traceMark === "function") {
        traceMark("orb.lifecycle3d", {
          event: "died",
          atMs: roundMetric(payload && payload.atMs, 1),
        });
      }
      orbGlobe3dRuntime.setDead(true);
      onOrbDied(payload);
      orbLifecycle3dRuntime.startDissolve(payload);
      scheduleFrame();
    }));
    unsubs.push(eventBus.on(EVT_ORB_REVIVED, (payload = {}) => {
      if (typeof traceMark === "function") {
        traceMark("orb.lifecycle3d", {
          event: "revived",
          health: roundMetric(payload && payload.health),
          maxHealth: roundMetric(payload && payload.maxHealth),
          atMs: roundMetric(payload && payload.atMs, 1),
        });
      }
      onOrbRevived();
      worldGlobe3dRuntime.resetToIdle();
      orbGlobe3dRuntime.revive();
      syncOrbVisualLifecycleState(payload, {
        lifecycleMode: "reset",
      });
    }));
  }

  return Object.freeze({
    bind,
    syncOrbLifecycleState: syncOrbVisualLifecycleState,
    dispose: clear,
  });
}
