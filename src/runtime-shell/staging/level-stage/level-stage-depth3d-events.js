import {
  EVT_ORB_DAMAGE_APPLIED,
  EVT_ORB_DIED,
  EVT_ORB_HEALED,
  EVT_ORB_REVIVED,
  EVT_PICKUP_COLLECTED,
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_RESOURCES_GLOBE_SPENT,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_LOADED,
} from "../../../contracts/events.js";

export function createLevelStageDepth3dEventBindings({
  root = null,
  worldGlobe3dRuntime = null,
  orbGlobe3dRuntime = null,
  orbLifecycle3dRuntime = null,
  loadWorldSpawns = () => {},
  scheduleFrame = () => {},
} = {}) {
  const unsubs = [];

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
    unsubs.push(eventBus.on(EVT_ORB_DAMAGE_APPLIED, (payload = {}) => {
      orbLifecycle3dRuntime.applyDamage(payload);
      scheduleFrame();
    }));
    unsubs.push(eventBus.on(EVT_ORB_HEALED, (payload = {}) => {
      orbLifecycle3dRuntime.heal(payload);
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
      orbLifecycle3dRuntime.startDissolve(payload);
      scheduleFrame();
    }));
    unsubs.push(eventBus.on(EVT_ORB_REVIVED, () => {
      orbGlobe3dRuntime.revive();
      scheduleFrame();
    }));
    unsubs.push(eventBus.on(EVT_ORB_REVIVED, (payload = {}) => {
      orbLifecycle3dRuntime.reset(payload);
      scheduleFrame();
    }));
  }

  return Object.freeze({
    bind,
    dispose: clear,
  });
}
