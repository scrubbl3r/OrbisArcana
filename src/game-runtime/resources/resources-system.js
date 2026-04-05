import {
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_RESOURCES_GLOBE_SPENT,
  EVT_PICKUP_COLLECTED,
  EVT_ORB_DIED,
  EVT_ORB_REVIVED,
} from "../../contracts/events.js";

/**
 * @typedef {Object} ResourcesSnapshot
 * @property {{storedCount:number}} globes
 */

/**
 * @typedef {Object} ResourcesSystem
 * @property {() => void} start Registers event subscriptions.
 * @property {() => void} stop Removes event subscriptions.
 * @property {(atMs?: number) => void} resetGlobes
 * @property {(atMs?: number) => void} resetAll
 * @property {() => number} getStoredGlobeCount
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
    storedGlobes: 0,
  };

  function emitGlobeInventoryChanged(atMs) {
    /** @type {import("../contracts/events.js").ResourcesGlobeInventoryChangedPayload} */
    const payload = {
      stored: state.storedGlobes,
      atMs: Number(atMs) || nowMs(),
    };
    eventBus.emit(EVT_RESOURCES_GLOBE_INVENTORY_CHANGED, payload);
  }

  function resetGlobes(atMs) {
    state.storedGlobes = 0;
    emitGlobeInventoryChanged(atMs);
  }

  function resetAll(atMs) {
    resetGlobes(atMs);
  }

  function getStoredGlobeCount() {
    return state.storedGlobes;
  }

  function snapshot() {
    return {
      globes: {
        storedCount: state.storedGlobes,
      },
      config: {},
    };
  }

  function addStoredGlobe(payload = {}) {
    const atMs = Number(payload.atMs) || nowMs();
    state.storedGlobes += 1;
    emitGlobeInventoryChanged(atMs);
    return state.storedGlobes;
  }

  function consumeStoredGlobe(payload = {}) {
    if (state.storedGlobes <= 0) return { ok: false, stored: 0 };
    const atMs = Number(payload.atMs) || nowMs();
    const wordId = (payload.wordId || payload.spellId) ? String(payload.wordId || payload.spellId) : undefined;
    state.storedGlobes = Math.max(0, state.storedGlobes - 1);
    eventBus.emit(EVT_RESOURCES_GLOBE_SPENT, {
      reason: String(payload.reason || "unknown"),
      wordId,
      spellId: wordId,
      axis: payload.axis ? String(payload.axis) : undefined,
      slot: payload.slot ? String(payload.slot) : undefined,
      stored: state.storedGlobes,
      atMs,
    });
    emitGlobeInventoryChanged(atMs);
    return { ok: true, stored: state.storedGlobes };
  }

  function start() {
    unsub.push(eventBus.on(EVT_PICKUP_COLLECTED, (payload = {}) => {
      if (String(payload.type || "") !== "energy_globe") return;
      addStoredGlobe({ atMs: payload.atMs });
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
    consumeStoredGlobe,
    snapshot,
  };
}
