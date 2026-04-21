export const STAGING_SHELL_MODE = Object.freeze({
  splitLab: "split-lab",
  levelOverlay: "level-overlay",
});

export const STAGING_DEV_STAGE_VISIBILITY = Object.freeze({
  shown: "shown",
  hidden: "hidden",
});

function normalizeMode(mode) {
  return String(mode || "").trim().toLowerCase() === STAGING_SHELL_MODE.levelOverlay
    ? STAGING_SHELL_MODE.levelOverlay
    : STAGING_SHELL_MODE.splitLab;
}

function normalizeDevVisibility(value) {
  return String(value || "").trim().toLowerCase() === STAGING_DEV_STAGE_VISIBILITY.hidden
    ? STAGING_DEV_STAGE_VISIBILITY.hidden
    : STAGING_DEV_STAGE_VISIBILITY.shown;
}

export function createStagingShellModeController({
  rootDocument = document,
  defaultMode = STAGING_SHELL_MODE.splitLab,
  defaultDevStageVisibility = STAGING_DEV_STAGE_VISIBILITY.shown,
} = {}) {
  const docEl = rootDocument && rootDocument.documentElement ? rootDocument.documentElement : null;
  const listeners = new Set();
  let mode = normalizeMode(defaultMode);
  let devStageVisibility = normalizeDevVisibility(defaultDevStageVisibility);

  function getState() {
    return {
      mode,
      devStageVisibility: mode === STAGING_SHELL_MODE.splitLab
        ? STAGING_DEV_STAGE_VISIBILITY.shown
        : devStageVisibility,
    };
  }

  function syncDom() {
    if (!docEl) return;
    const state = getState();
    docEl.dataset.stagingShell = state.mode;
    docEl.dataset.stagingShellMode = state.mode;
    docEl.dataset.devStageVisibility = state.devStageVisibility;
  }

  function notify() {
    const snapshot = getState();
    syncDom();
    for (const listener of listeners) {
      try { listener(snapshot); } catch (_) {}
    }
  }

  function setMode(nextMode) {
    const normalized = normalizeMode(nextMode);
    if (normalized === mode) {
      notify();
      return getState();
    }
    mode = normalized;
    if (mode === STAGING_SHELL_MODE.splitLab) {
      devStageVisibility = STAGING_DEV_STAGE_VISIBILITY.shown;
    }
    notify();
    return getState();
  }

  function setDevStageVisibility(nextVisibility) {
    devStageVisibility = normalizeDevVisibility(nextVisibility);
    notify();
    return getState();
  }

  function toggleDevStageVisibility() {
    if (mode !== STAGING_SHELL_MODE.levelOverlay) return getState();
    return setDevStageVisibility(
      devStageVisibility === STAGING_DEV_STAGE_VISIBILITY.hidden
        ? STAGING_DEV_STAGE_VISIBILITY.shown
        : STAGING_DEV_STAGE_VISIBILITY.hidden
    );
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    try { listener(getState()); } catch (_) {}
    return () => {
      listeners.delete(listener);
    };
  }

  syncDom();

  return {
    getState,
    setMode,
    setDevStageVisibility,
    toggleDevStageVisibility,
    subscribe,
  };
}
