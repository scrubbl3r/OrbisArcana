/**
 * Voice provider manager: toggles between multiple providers while preserving a
 * stable downstream event contract (`voice.spell_*` via event bus).
 *
 * This is non-invasive and can wrap the current STT path while KWS is added in
 * shadow mode.
 */

/**
 * @typedef {Object} VoiceProvider
 * @property {string} id
 * @property {Function} [start]
 * @property {Function} [stop]
 * @property {Function} [destroy]
 * @property {Function} [setEnabled]
 * @property {Function} [setMode]
 * @property {Function} [getStatus]
 */

/**
 * @param {{ providers?: Record<string, VoiceProvider>, activeId?: string }} [opts]
 */
export function createVoiceProviderManager(opts = {}) {
  /** @type {Map<string, VoiceProvider>} */
  const providers = new Map(Object.entries(opts.providers || {}));
  let activeId = String(opts.activeId || (providers.keys().next().value || ""));

  function get(id) {
    return providers.get(String(id || ""));
  }

  function register(provider) {
    if (!provider || !provider.id) return false;
    providers.set(String(provider.id), provider);
    if (!activeId) activeId = String(provider.id);
    return true;
  }

  function setActive(id) {
    const nextId = String(id || "");
    if (!providers.has(nextId)) return false;
    if (activeId === nextId) return true;
    const prev = get(activeId);
    if (prev && typeof prev.setEnabled === "function") prev.setEnabled(false);
    if (prev && typeof prev.stop === "function") prev.stop();
    activeId = nextId;
    const next = get(activeId);
    if (next && typeof next.setEnabled === "function") next.setEnabled(true);
    return true;
  }

  function start() {
    const p = get(activeId);
    if (p && typeof p.setEnabled === "function") p.setEnabled(true);
    if (p && typeof p.start === "function") p.start();
  }

  function stop() {
    const p = get(activeId);
    if (p && typeof p.stop === "function") p.stop();
  }

  function destroy() {
    for (const p of providers.values()) {
      if (p && typeof p.destroy === "function") p.destroy();
    }
  }

  function setMode(mode) {
    const p = get(activeId);
    if (p && typeof p.setMode === "function") p.setMode(mode);
  }

  function getStatus() {
    const active = get(activeId);
    return {
      activeId,
      providers: Array.from(providers.keys()),
      activeStatus: active && typeof active.getStatus === "function" ? active.getStatus() : null,
    };
  }

  return Object.freeze({
    register,
    get,
    setActive,
    start,
    stop,
    destroy,
    setMode,
    getStatus,
    getActiveId: () => activeId,
  });
}

