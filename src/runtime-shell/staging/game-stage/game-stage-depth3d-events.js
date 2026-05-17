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

  function clamp01(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(1, numeric));
  }

  function lerpFloat(from, to, t) {
    return Number(from) + ((Number(to) - Number(from)) * clamp01(t));
  }

  function applyOrbHpShaderState(payload = {}) {
    const maxHealth = Math.max(1, Number(payload.maxHealth ?? payload.max) || 1000);
    const health = Math.max(0, Math.min(maxHealth, Number(payload.health ?? payload.to ?? payload.healthAfter) || 0));
    const healthRatio = clamp01(health / maxHealth);
    const shaderState = {
      luminanceBoost: lerpFloat(1.2, 1.7, healthRatio),
      centerAlpha: lerpFloat(0.013, 0.018, healthRatio),
      spotIntensity: lerpFloat(22, 27, healthRatio),
      spotDistanceBO: lerpFloat(4.1, 4.8, healthRatio),
    };
    if (typeof setOrbShaderState === "function") setOrbShaderState(shaderState);
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
    dispose: clear,
  });
}
