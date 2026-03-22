export function createKwsBootOrchestrator({
  constants = {},
  callbacks = {},
} = {}) {
  const DEFAULT_KWS_BACKEND_KEY = String(constants.defaultBackendKey || "openwakeword_browser");
  const DEFAULT_VOICE_ENGINE = String(constants.defaultVoiceEngine || "kws");
  void DEFAULT_VOICE_ENGINE;

  function resolveKwsProvider(mvp) {
    return (mvp && (mvp.kwsWordProvider || mvp.kwsVoiceProvider)) || null;
  }

  function emitWakeMode(mvp) {
    if (typeof callbacks.emitWakeMode === "function") {
      callbacks.emitWakeMode(mvp);
      return;
    }
    const bus = mvp && mvp.eventBus;
    if (bus && typeof bus.emit === "function") {
      bus.emit("voice.set_mode", { mode: "wake_token_open_world" });
    }
  }

  function getKwsBootErrorReason(mvp) {
    const provider = resolveKwsProvider(mvp);
    const status = provider && typeof provider.getStatus === "function"
      ? provider.getStatus()
      : null;
    return status && status.micError ? String(status.micError) : "kws_link_start_failed";
  }

  async function bootNow(mvp) {
    if (!mvp) return false;
    if (typeof mvp.setKwsBackend === "function") await mvp.setKwsBackend(DEFAULT_KWS_BACKEND_KEY);
    if (typeof mvp.setVoiceEngine === "function") mvp.setVoiceEngine();
    const micOk = (typeof mvp.setKwsMicEnabled === "function")
      ? await mvp.setKwsMicEnabled(true)
      : true;
    if (micOk === false) throw new Error(getKwsBootErrorReason(mvp));

    const provider = resolveKwsProvider(mvp);
    if (provider && typeof provider.setEnabled === "function") provider.setEnabled(true);
    if (provider && typeof provider.setMode === "function") provider.setMode("active");
    emitWakeMode(mvp);

    if (typeof callbacks.onBootSuccess === "function") callbacks.onBootSuccess(mvp);
    return true;
  }

  function bootAndAutostart(mvp) {
    if (!mvp) return;
    Promise.resolve()
      .then(() => bootNow(mvp))
      .catch((err) => {
        if (typeof callbacks.onBootFailed === "function") callbacks.onBootFailed(err);
        else console.warn("KWS boot auto-init failed:", err);
      });
    if (typeof callbacks.startAutostartWatchdog === "function") {
      callbacks.startAutostartWatchdog();
    }
  }

  return {
    bootNow,
    bootAndAutostart,
  };
}
