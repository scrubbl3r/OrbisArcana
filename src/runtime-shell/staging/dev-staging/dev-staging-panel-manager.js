export function createDevStagingPanelManager({
  stackHost = null,
  sharedRefs = null,
} = {}) {
  const panelDefs = new Map();
  const panelHooks = new Map();
  const openPanels = new Map();
  const panelOrder = [];
  const listeners = new Set();

  function notify() {
    const snapshot = getState();
    for (const listener of listeners) {
      try { listener(snapshot); } catch (_) {}
    }
  }

  function mergePanelRefs(refs = {}) {
    if (!sharedRefs || !refs || typeof refs !== "object") return;
    Object.assign(sharedRefs, refs);
  }

  function unmergePanelRefs(refs = {}) {
    if (!sharedRefs || !refs || typeof refs !== "object") return;
    for (const key of Object.keys(refs)) {
      if (sharedRefs[key] === refs[key]) delete sharedRefs[key];
    }
  }

  function registerPanel(id, definition = {}) {
    const panelId = String(id || "").trim();
    if (!panelId) return;
    panelDefs.set(panelId, { ...definition });
    notify();
  }

  function registerPanelHooks(id, hooks = {}) {
    const panelId = String(id || "").trim();
    if (!panelId) return;
    panelHooks.set(panelId, { ...hooks });
  }

  function getPanelHookSet(id) {
    return panelHooks.get(String(id || "").trim()) || {};
  }

  function isOpen(id) {
    return openPanels.has(String(id || "").trim());
  }

  function promotePanel(panelId) {
    const state = openPanels.get(panelId);
    if (!state || !state.host || !stackHost) return state || null;
    const existingIndex = panelOrder.indexOf(panelId);
    if (existingIndex >= 0) panelOrder.splice(existingIndex, 1);
    panelOrder.unshift(panelId);
    stackHost.insertBefore(state.host, stackHost.firstChild || null);
    notify();
    return state;
  }

  function openPanel(id) {
    const panelId = String(id || "").trim();
    if (!panelId || !stackHost) return null;
    if (openPanels.has(panelId)) return promotePanel(panelId);
    const definition = panelDefs.get(panelId);
    if (!definition || typeof definition.mount !== "function") return null;

    const host = document.createElement("section");
    host.className = "devStagingStackItem";
    host.dataset.panelId = panelId;
    stackHost.insertBefore(host, stackHost.firstChild || null);

    const instance = definition.mount(host) || {};
    const refs = instance.refs && typeof instance.refs === "object" ? instance.refs : {};
    mergePanelRefs(refs);

    const state = { id: panelId, host, instance, refs };
    openPanels.set(panelId, state);
    panelOrder.unshift(panelId);

    const hooks = getPanelHookSet(panelId);
    if (typeof hooks.onMount === "function") {
      try { hooks.onMount(state); } catch (_) {}
    }
    notify();
    return state;
  }

  function closePanel(id) {
    const panelId = String(id || "").trim();
    const state = openPanels.get(panelId);
    if (!state) return false;

    const hooks = getPanelHookSet(panelId);
    if (typeof hooks.onBeforeClose === "function") {
      try { hooks.onBeforeClose(state); } catch (_) {}
    }
    if (state.instance && typeof state.instance.unmount === "function") {
      try { state.instance.unmount(); } catch (_) {}
    }
    unmergePanelRefs(state.refs);
    if (state.host && state.host.parentNode) {
      state.host.parentNode.removeChild(state.host);
    }
    openPanels.delete(panelId);
    const existingIndex = panelOrder.indexOf(panelId);
    if (existingIndex >= 0) panelOrder.splice(existingIndex, 1);
    if (typeof hooks.onAfterClose === "function") {
      try { hooks.onAfterClose(state); } catch (_) {}
    }
    notify();
    return true;
  }

  function togglePanel(id) {
    return isOpen(id) ? !closePanel(id) : !!openPanel(id);
  }

  function closeTopmostPanel() {
    const topmostId = panelOrder.length ? panelOrder[0] : "";
    if (!topmostId) return false;
    return closePanel(topmostId);
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    try { listener(getState()); } catch (_) {}
    return () => {
      listeners.delete(listener);
    };
  }

  function getState() {
    const openPanelIds = panelOrder.slice();
    return {
      openPanelIds,
      topmostPanelId: openPanelIds.length ? openPanelIds[0] : "",
      panels: Array.from(panelDefs.entries()).map(([id, def]) => ({
        id,
        title: String(def.title || id),
        open: openPanels.has(id),
      })),
    };
  }

  return {
    registerPanel,
    registerPanelHooks,
    openPanel,
    closePanel,
    closeTopmostPanel,
    togglePanel,
    isOpen,
    subscribe,
    getState,
  };
}
