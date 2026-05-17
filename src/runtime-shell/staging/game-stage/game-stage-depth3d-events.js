import {
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
  setOrbShaderState = () => {},
  loadWorldSpawns = () => {},
  onOrbDied = () => {},
  onOrbRevived = () => {},
  scheduleFrame = () => {},
} = {}) {
  const unsubs = [];
  const orbShaderHealthState = {
    health: 1000,
    maxHealth: 1000,
  };

  function clamp01(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(1, numeric));
  }

  function lerpFloat(from, to, t) {
    return Number(from) + ((Number(to) - Number(from)) * clamp01(t));
  }

  function firstFinite(...values) {
    for (const value of values) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
    return null;
  }

  function resolveOrbShaderHealth(payload = {}) {
    let healthSource = "previous";
    const maxHealth = Math.max(1, firstFinite(
      payload.vitality && payload.vitality.maxHealth,
      payload.maxHealth,
      payload.max,
      payload.maxHp,
      payload.maxHits,
      orbShaderHealthState.maxHealth,
      1000
    ));
    let health = firstFinite(
      payload.vitality && payload.vitality.health,
      payload.health,
      payload.hp,
      payload.to,
      payload.healthAfter,
      payload.hitsRemaining
    );
    if (health != null) healthSource = "health";
    if (health == null && Number.isFinite(Number(payload.hitsTaken))) {
      health = maxHealth - Number(payload.hitsTaken);
      healthSource = "hitsTaken";
    }
    if (health == null && Number.isFinite(Number(payload.damageRatio))) {
      health = maxHealth * (1 - clamp01(payload.damageRatio));
      healthSource = "damageRatio";
    }
    if (health == null) health = orbShaderHealthState.health;
    orbShaderHealthState.maxHealth = maxHealth;
    orbShaderHealthState.health = Math.max(0, Math.min(maxHealth, health));
    return {
      health: orbShaderHealthState.health,
      maxHealth,
      healthSource,
    };
  }

  function applyOrbHpShaderState(payload = {}) {
    const vitality = payload && typeof payload.vitality === "object" ? payload.vitality : null;
    const vitalityShaderState = vitality && typeof vitality.shaderState === "object" ? vitality.shaderState : null;
    const { health, maxHealth, healthSource } = resolveOrbShaderHealth(payload);
    const healthRatio = clamp01(health / maxHealth);
    const fallbackShaderState = {
      luminanceBoost: lerpFloat(1.2, 1.8, healthRatio),
      centerAlpha: lerpFloat(0.013, 0.018, healthRatio),
      spotIntensity: lerpFloat(24, 29, healthRatio),
      spotDistanceBO: lerpFloat(4.2, 4.9, healthRatio),
    };
    const shaderState = vitalityShaderState || fallbackShaderState;
    if (root && root.dataset) {
      root.dataset.orbShaderHp = String(Math.round(health * 1000) / 1000);
      root.dataset.orbShaderMaxHp = String(Math.round(maxHealth * 1000) / 1000);
      root.dataset.orbShaderHealthSource = vitalityShaderState ? "vitality" : healthSource;
      root.dataset.orbShaderVitalityHealth = vitality && vitality.health != null ? String(vitality.health) : "";
      root.dataset.orbShaderVitalityRatio = vitality && vitality.healthRatio != null ? String(vitality.healthRatio) : "";
      root.dataset.orbShaderPayloadHealth = payload.health == null ? "" : String(payload.health);
      root.dataset.orbShaderPayloadTo = payload.to == null ? "" : String(payload.to);
      root.dataset.orbShaderPayloadHealthAfter = payload.healthAfter == null ? "" : String(payload.healthAfter);
      root.dataset.orbShaderPayloadHitsTaken = payload.hitsTaken == null ? "" : String(payload.hitsTaken);
      root.dataset.orbShaderPayloadMaxHits = payload.maxHits == null ? "" : String(payload.maxHits);
      root.dataset.orbShaderPayloadDamageRatio = payload.damageRatio == null ? "" : String(payload.damageRatio);
      root.dataset.orbShaderHealthRatio = String(Math.round(healthRatio * 1000) / 1000);
      root.dataset.orbShaderLuminanceBoost = String(Math.round(shaderState.luminanceBoost * 1000) / 1000);
      root.dataset.orbShaderCenterAlpha = String(Math.round(shaderState.centerAlpha * 1000) / 1000);
      root.dataset.orbShaderSpotIntensity = String(Math.round(shaderState.spotIntensity * 1000) / 1000);
      root.dataset.orbShaderSpotDistanceBO = String(Math.round(shaderState.spotDistanceBO * 1000) / 1000);
    }
    if (typeof setOrbShaderState === "function") setOrbShaderState(shaderState);
    return shaderState;
  }

  function clear() {
    while (unsubs.length) {
      const off = unsubs.pop();
      try { off(); } catch (_) {}
    }
  }

  function bind({ eventBus = null, spawns = [] } = {}) {
    if (root && root.dataset) {
      root.dataset.depthGlobe3dBound = eventBus && typeof eventBus.on === "function" ? "true" : "false";
    }
    clear();
    loadWorldSpawns(spawns);
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
      orbLifecycle3dRuntime.syncDamageState(payload);
      applyOrbHpShaderState(payload);
      scheduleFrame();
    }));
    unsubs.push(eventBus.on(EVT_VOICE_SPELL_LOADED, (payload = {}) => {
      orbGlobe3dRuntime.load(payload);
    }));
    unsubs.push(eventBus.on(EVT_VOICE_SPELL_CAST, (payload = {}) => {
      orbGlobe3dRuntime.consume(payload);
    }));
    unsubs.push(eventBus.on(EVT_ORB_DIED, () => {
      orbGlobe3dRuntime.setDead(true);
    }));
    unsubs.push(eventBus.on(EVT_ORB_DIED, (payload = {}) => {
      onOrbDied(payload);
      orbLifecycle3dRuntime.startDissolve(payload);
      scheduleFrame();
    }));
    unsubs.push(eventBus.on(EVT_ORB_REVIVED, () => {
      onOrbRevived();
      worldGlobe3dRuntime.resetToIdle();
      orbGlobe3dRuntime.revive();
      scheduleFrame();
    }));
    unsubs.push(eventBus.on(EVT_ORB_REVIVED, (payload = {}) => {
      orbLifecycle3dRuntime.reset(payload);
      applyOrbHpShaderState(payload);
      scheduleFrame();
    }));
  }

  return Object.freeze({
    bind,
    syncOrbHpShaderState: applyOrbHpShaderState,
    dispose: clear,
  });
}
