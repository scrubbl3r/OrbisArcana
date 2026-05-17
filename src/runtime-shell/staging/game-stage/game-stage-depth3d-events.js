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
  setOrbShaderState = () => {},
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

  function applyOrbHpShaderState(payload = {}) {
    const vitality = payload && typeof payload.vitality === "object" ? payload.vitality : null;
    const vitalityShaderState = vitality && typeof vitality.shaderState === "object" ? vitality.shaderState : null;
    if (root && root.dataset) {
      root.dataset.orbShaderEventCount = String((Number(root.dataset.orbShaderEventCount) || 0) + 1);
      root.dataset.orbShaderLastEventAt = roundMetric(payload && payload.atMs, 1);
      root.dataset.orbShaderHealthSource = vitalityShaderState ? "vitality" : "missing";
      root.dataset.orbShaderHp = roundMetric(vitality && vitality.health);
      root.dataset.orbShaderMaxHp = roundMetric(vitality && vitality.maxHealth);
      root.dataset.orbShaderHealthRatio = roundMetric(vitality && vitality.healthRatio);
      root.dataset.orbShaderLuminanceBoost = roundMetric(vitalityShaderState && vitalityShaderState.luminanceBoost);
      root.dataset.orbShaderCenterAlpha = roundMetric(vitalityShaderState && vitalityShaderState.centerAlpha);
      root.dataset.orbShaderSpotIntensity = roundMetric(vitalityShaderState && vitalityShaderState.spotIntensity);
      root.dataset.orbShaderSpotDistanceBO = roundMetric(vitalityShaderState && vitalityShaderState.spotDistanceBO);
    }
    if (typeof traceMark === "function") {
      traceMark("orb.shader.vitality", {
        source: vitalityShaderState ? "vitality" : "missing",
        health: roundMetric(vitality && vitality.health),
        maxHealth: roundMetric(vitality && vitality.maxHealth),
        healthRatio: roundMetric(vitality && vitality.healthRatio),
        luminanceBoost: roundMetric(vitalityShaderState && vitalityShaderState.luminanceBoost),
        centerAlpha: roundMetric(vitalityShaderState && vitalityShaderState.centerAlpha),
        spotIntensity: roundMetric(vitalityShaderState && vitalityShaderState.spotIntensity),
        spotDistanceBO: roundMetric(vitalityShaderState && vitalityShaderState.spotDistanceBO),
        atMs: roundMetric(payload && payload.atMs, 1),
      });
    }
    if (!vitalityShaderState) return null;
    if (typeof setOrbShaderState === "function") setOrbShaderState(vitalityShaderState);
    return vitalityShaderState;
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
    unsubs.push(eventBus.on(EVT_ORB_DAMAGE_APPLIED, (payload = {}) => {
      if (typeof traceMark !== "function") return;
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
    }));
    unsubs.push(eventBus.on(EVT_VOICE_SPELL_LOADED, (payload = {}) => {
      orbGlobe3dRuntime.load(payload);
    }));
    unsubs.push(eventBus.on(EVT_VOICE_SPELL_CAST, (payload = {}) => {
      orbGlobe3dRuntime.consume(payload);
    }));
    unsubs.push(eventBus.on(EVT_ORB_DIED, (payload = {}) => {
      if (root && root.dataset) root.dataset.orbShaderLastLifecycleEvent = "died";
      if (typeof traceMark === "function") {
        traceMark("orb.shader.lifecycle", {
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
      if (root && root.dataset) root.dataset.orbShaderLastLifecycleEvent = "revived";
      if (typeof traceMark === "function") {
        traceMark("orb.shader.lifecycle", {
          event: "revived",
          health: roundMetric(payload && payload.health),
          maxHealth: roundMetric(payload && payload.maxHealth),
          atMs: roundMetric(payload && payload.atMs, 1),
        });
      }
      onOrbRevived();
      worldGlobe3dRuntime.resetToIdle();
      orbGlobe3dRuntime.revive();
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
