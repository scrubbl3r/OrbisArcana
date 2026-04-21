export function createDevStagingPanelManager({
  stackHost = null,
  sharedRefs = null,
} = {}) {
  const panelDefs = new Map();
  const panelHooks = new Map();
  const openPanels = new Map();

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

  function openPanel(id) {
    const panelId = String(id || "").trim();
    if (!panelId || !stackHost) return null;
    if (openPanels.has(panelId)) return openPanels.get(panelId);
    const definition = panelDefs.get(panelId);
    if (!definition || typeof definition.mount !== "function") return null;

    const host = document.createElement("section");
    host.className = "devStagingStackItem";
    host.dataset.panelId = panelId;
    stackHost.appendChild(host);

    const instance = definition.mount(host) || {};
    const refs = instance.refs && typeof instance.refs === "object" ? instance.refs : {};
    mergePanelRefs(refs);

    const state = { id: panelId, host, instance, refs };
    openPanels.set(panelId, state);

    const hooks = getPanelHookSet(panelId);
    if (typeof hooks.onMount === "function") {
      try { hooks.onMount(state); } catch (_) {}
    }
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
    if (typeof hooks.onAfterClose === "function") {
      try { hooks.onAfterClose(state); } catch (_) {}
    }
    return true;
  }

  function togglePanel(id) {
    return isOpen(id) ? !closePanel(id) : !!openPanel(id);
  }

  function getState() {
    return {
      openPanelIds: Array.from(openPanels.keys()),
    };
  }

  return {
    registerPanel,
    registerPanelHooks,
    openPanel,
    closePanel,
    togglePanel,
    isOpen,
    getState,
  };
}
