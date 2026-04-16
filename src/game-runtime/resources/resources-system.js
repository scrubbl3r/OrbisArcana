import {
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_RESOURCES_GLOBE_SPENT,
  EVT_PICKUP_COLLECTED,
  EVT_ORB_DIED,
  EVT_ORB_REVIVED,
} from "../../contracts/events.js";

/**
 * @typedef {Object} ResourcesSnapshot
 * @property {{storedCount:number, records:Array<Object>}} globes
 */

/**
 * @typedef {Object} ResourcesSystem
 * @property {() => void} start Registers event subscriptions.
 * @property {() => void} stop Removes event subscriptions.
 * @property {(atMs?: number) => void} resetGlobes
 * @property {(atMs?: number) => void} resetAll
 * @property {() => number} getStoredGlobeCount
 * @property {(payload?: Object) => {ok:boolean, stored:number, globe?:Object}} bindLoadedGlobe
 * @property {(payload?: Object) => {ok:boolean, stored:number, globe?:Object}} spendBoundGlobe
 * @property {(payload?: Object) => {ok:boolean, stored:number}} consumeStoredGlobe
 * @property {() => ResourcesSnapshot} snapshot
 */

/**
 * @typedef {Object} CreateResourcesSystemOptions
 * @property {Object} eventBus Event bus with `emit` and `on`.
 * @property {() => number} [nowMs] Clock function.
 * @property {Object} [config]
 */

/**
 * Authoritative resource domain state for stored globes.
 *
 * Side effects:
 * - Emits resource events on state changes
 * - Listens to pickup and orb lifecycle events
 *
 * @param {CreateResourcesSystemOptions} [options]
 * @returns {ResourcesSystem}
 */
export function createResourcesSystem({
  eventBus,
  nowMs = () => Date.now(),
  config = {},
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createResourcesSystem requires eventBus.on/eventBus.emit");
  }

  const unsub = [];
  const state = {
    globes: [],
    nextGeneratedGlobeId: 1,
  };

  function loadedGlobes() {
    return state.globes.filter((g) => g && String(g.state || "") === "loaded");
  }

  function activeGlobesSnapshot() {
    return state.globes
      .filter((g) => g && String(g.state || "") !== "spent")
      .map((g) => ({ ...g }));
  }

  function storedCount() {
    return loadedGlobes().length;
  }

  function emitGlobeInventoryChanged(atMs) {
    /** @type {import("../contracts/events.js").ResourcesGlobeInventoryChangedPayload} */
    const payload = {
      stored: storedCount(),
      globes: activeGlobesSnapshot(),
      atMs: Number(atMs) || nowMs(),
    };
    eventBus.emit(EVT_RESOURCES_GLOBE_INVENTORY_CHANGED, payload);
  }

  function resetGlobes(atMs) {
    state.globes = [];
    emitGlobeInventoryChanged(atMs);
  }

  function resetAll(atMs) {
    resetGlobes(atMs);
  }

  function getStoredGlobeCount() {
    return storedCount();
  }

  function snapshot() {
    return {
      globes: {
        storedCount: storedCount(),
        records: activeGlobesSnapshot(),
      },
      config: {},
    };
  }

  function addStoredGlobe(payload = {}) {
    const atMs = Number(payload.atMs) || nowMs();
    const globeId = String(payload.globeId || payload.id || `generated_globe_${state.nextGeneratedGlobeId++}`);
    const emitterId = String(payload.emitterId || "");
    state.globes.push({
      globeId,
      id: globeId,
      emitterId,
      sourcePickupId: payload.id ? String(payload.id) : "",
      caughtAtMs: atMs,
      state: "loaded",
      spinAxis: payload.spinAxis ? String(payload.spinAxis) : "",
      spinDirection: payload.spinDirection ? String(payload.spinDirection) : "",
      imprintColor: payload.imprintColor || null,
    });
    emitGlobeInventoryChanged(atMs);
    return storedCount();
  }

  function bindLoadedGlobe(payload = {}) {
    const globe = loadedGlobes()[0] || null;
    if (!globe) return { ok: false, stored: 0 };
    const atMs = Number(payload.atMs) || nowMs();
    globe.state = "bound";
    globe.boundAtMs = atMs;
    globe.slot = payload.slot ? String(payload.slot).toUpperCase() : "";
    globe.wordId = (payload.wordId || payload.spellId) ? String(payload.wordId || payload.spellId) : "";
    globe.spellId = (payload.spellId || payload.wordId) ? String(payload.spellId || payload.wordId) : "";
    globe.axis = payload.axis ? String(payload.axis) : "";
    emitGlobeInventoryChanged(atMs);
    return { ok: true, stored: storedCount(), globe: { ...globe } };
  }

  function findBoundGlobe(payload = {}) {
    const globeId = String(payload.globeId || payload.boundGlobeId || "");
    const slot = payload.slot ? String(payload.slot).toUpperCase() : "";
    if (globeId) {
      return state.globes.find((g) => g && String(g.globeId || "") === globeId && String(g.state || "") === "bound") || null;
    }
    if (slot) {
      return state.globes.find((g) => g && String(g.slot || "").toUpperCase() === slot && String(g.state || "") === "bound") || null;
    }
    return state.globes.find((g) => g && String(g.state || "") === "bound") || null;
  }

  function emitGlobeSpent(globe, payload = {}, atMs) {
    const wordId = (payload.wordId || payload.spellId || globe.wordId || globe.spellId)
      ? String(payload.wordId || payload.spellId || globe.wordId || globe.spellId)
      : undefined;
    eventBus.emit(EVT_RESOURCES_GLOBE_SPENT, {
      reason: String(payload.reason || "unknown"),
      globeId: String(globe.globeId || globe.id || ""),
      emitterId: String(globe.emitterId || ""),
      wordId,
      spellId: wordId,
      axis: payload.axis ? String(payload.axis) : (globe.axis ? String(globe.axis) : undefined),
      slot: payload.slot ? String(payload.slot) : (globe.slot ? String(globe.slot) : undefined),
      stored: storedCount(),
      atMs,
    });
  }

  function spendBoundGlobe(payload = {}) {
    const globe = findBoundGlobe(payload);
    if (!globe) return { ok: false, stored: storedCount() };
    const atMs = Number(payload.atMs) || nowMs();
    globe.state = "spent";
    globe.spentAtMs = atMs;
    emitGlobeSpent(globe, payload, atMs);
    state.globes = state.globes.filter((g) => g !== globe);
    emitGlobeInventoryChanged(atMs);
    return { ok: true, stored: storedCount(), globe: { ...globe } };
  }

  function consumeStoredGlobe(payload = {}) {
    const globe = loadedGlobes()[0] || null;
    if (!globe) return { ok: false, stored: 0 };
    const atMs = Number(payload.atMs) || nowMs();
    globe.state = "spent";
    globe.spentAtMs = atMs;
    emitGlobeSpent(globe, payload, atMs);
    state.globes = state.globes.filter((g) => g !== globe);
    emitGlobeInventoryChanged(atMs);
    return { ok: true, stored: storedCount(), globe: { ...globe } };
  }

  function start() {
    unsub.push(eventBus.on(EVT_PICKUP_COLLECTED, (payload = {}) => {
      if (String(payload.type || "") !== "energy_globe") return;
      addStoredGlobe(payload);
    }));
    unsub.push(eventBus.on(EVT_ORB_DIED, () => {
      resetGlobes();
    }));
    unsub.push(eventBus.on(EVT_ORB_REVIVED, () => {
      resetGlobes();
    }));
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  return {
    start,
    stop,
    resetGlobes,
    resetAll,
    getStoredGlobeCount,
    bindLoadedGlobe,
    spendBoundGlobe,
    consumeStoredGlobe,
    snapshot,
  };
}
