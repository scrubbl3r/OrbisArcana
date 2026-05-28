export const ORB_STATE_IDS = Object.freeze({
  GRAVITON_FLOAT_LOCK: "graviton_float_lock",
});

export const ORB_STATE_REGISTRY = Object.freeze({
  [ORB_STATE_IDS.GRAVITON_FLOAT_LOCK]: Object.freeze({
    id: ORB_STATE_IDS.GRAVITON_FLOAT_LOCK,
    owner: "graviton",
    clearPolicy: "source_toggle_only",
    clearOn: Object.freeze(["death", "revive", "reset"]),
    suppressInput: true,
    breakOnLift: false,
    breakOnMotion: false,
    preserveAgainstGrace: true,
    visualState: "float",
  }),
});

function nowMs() {
  return typeof performance !== "undefined" && performance && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function asId(value) {
  return String(value || "").trim().toLowerCase();
}

function cloneStateMap(raw) {
  return raw && typeof raw === "object" ? { ...raw } : Object.create(null);
}

export function createOrbStateMixer({
  orbRuntimeState,
  registry = ORB_STATE_REGISTRY,
} = {}) {
  function getRuntimeState() {
    return orbRuntimeState && typeof orbRuntimeState.get === "function"
      ? orbRuntimeState.get()
      : null;
  }

  function patchRuntimeState(patch = {}) {
    if (!orbRuntimeState || typeof orbRuntimeState.patch !== "function") return null;
    return orbRuntimeState.patch(patch);
  }

  function getDefinition(stateId) {
    return registry[asId(stateId)] || null;
  }

  function getStates() {
    const state = getRuntimeState();
    return state && state.orbStates && typeof state.orbStates === "object"
      ? state.orbStates
      : Object.create(null);
  }

  function patchStates(nextStates) {
    return patchRuntimeState({ orbStates: nextStates && typeof nextStates === "object" ? nextStates : Object.create(null) });
  }

  function get(stateId) {
    const id = asId(stateId);
    const entry = getStates()[id] || null;
    return entry && entry.active !== false ? entry : null;
  }

  function isActive(stateId) {
    return !!get(stateId);
  }

  function activate(stateId, payload = {}) {
    const id = asId(stateId);
    const def = getDefinition(id);
    if (!def) return null;
    const owner = asId(payload.owner || payload.source || payload.sourceWordId || def.owner);
    const states = cloneStateMap(getStates());
    const entry = Object.freeze({
      id,
      active: true,
      owner,
      source: asId(payload.source || payload.sourceWordId || owner),
      clearPolicy: String(payload.clearPolicy || def.clearPolicy || ""),
      activatedAtMs: Number(payload.atMs) || nowMs(),
      visualState: String(payload.visualState || def.visualState || ""),
    });
    states[id] = entry;
    patchStates(states);
    return entry;
  }

  function canClear(stateId, request = {}) {
    const id = asId(stateId);
    const entry = get(id);
    if (!entry) return true;
    const def = getDefinition(id);
    if (request.force === true) return true;
    const reason = asId(request.reason);
    const clearOn = Array.isArray(def && def.clearOn) ? def.clearOn.map(asId) : [];
    if (reason && clearOn.includes(reason)) return true;
    const clearPolicy = String(entry.clearPolicy || (def && def.clearPolicy) || "");
    if (clearPolicy === "source_toggle_only") {
      const source = asId(request.source || request.sourceWordId || request.wordId || request.spellId);
      return !!source && source === asId(entry.owner || (def && def.owner));
    }
    return true;
  }

  function deactivate(stateId, request = {}) {
    const id = asId(stateId);
    if (!get(id)) return true;
    if (!canClear(id, request)) return false;
    const states = cloneStateMap(getStates());
    delete states[id];
    patchStates(states);
    return true;
  }

  function clearByLifecycle(reason, request = {}) {
    const states = cloneStateMap(getStates());
    let changed = false;
    const normalizedReason = asId(reason);
    for (const id of Object.keys(states)) {
      const def = getDefinition(id);
      const clearOn = Array.isArray(def && def.clearOn) ? def.clearOn.map(asId) : [];
      if (request.force === true || clearOn.includes(normalizedReason)) {
        delete states[id];
        changed = true;
      }
    }
    if (changed) patchStates(states);
    return changed;
  }

  function isFloatLocked() {
    return isActive(ORB_STATE_IDS.GRAVITON_FLOAT_LOCK);
  }

  function getMovementPolicy() {
    const floatLock = get(ORB_STATE_IDS.GRAVITON_FLOAT_LOCK);
    if (!floatLock) return Object.freeze({});
    const def = getDefinition(ORB_STATE_IDS.GRAVITON_FLOAT_LOCK);
    return Object.freeze({
      suppressInput: def.suppressInput === true,
      breakOnLift: def.breakOnLift !== false,
      breakOnMotion: def.breakOnMotion !== false,
    });
  }

  function shouldPreserveAgainstGrace(grace = {}) {
    if (!isFloatLocked()) return false;
    const def = getDefinition(ORB_STATE_IDS.GRAVITON_FLOAT_LOCK);
    if (!def || def.preserveAgainstGrace !== true) return false;
    const lock = get(ORB_STATE_IDS.GRAVITON_FLOAT_LOCK);
    const incomingLockSource = asId(grace && grace.lockSource);
    return !incomingLockSource || incomingLockSource !== asId(lock && lock.owner);
  }

  return Object.freeze({
    registry,
    getDefinition,
    get,
    isActive,
    activate,
    canClear,
    deactivate,
    clearByLifecycle,
    isFloatLocked,
    getMovementPolicy,
    shouldPreserveAgainstGrace,
  });
}
