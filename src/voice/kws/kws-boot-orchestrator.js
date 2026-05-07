export function createKwsBootOrchestrator({
  constants = {},
  callbacks = {},
} = {}) {
  const DEFAULT_KWS_BACKEND_KEY = String(constants.defaultBackendKey || "openwakeword_browser");
  const DEFAULT_VOICE_ENGINE = String(constants.defaultVoiceEngine || "kws");
  void DEFAULT_VOICE_ENGINE;

  function resolveKwsProvider(receiverRuntime) {
    return (receiverRuntime && (receiverRuntime.kwsWordProvider || receiverRuntime.kwsVoiceProvider)) || null;
  }

  function emitWakeMode(receiverRuntime) {
    if (typeof callbacks.emitWakeMode === "function") {
      callbacks.emitWakeMode(receiverRuntime);
      return;
    }
    const bus = receiverRuntime && receiverRuntime.eventBus;
    if (bus && typeof bus.emit === "function") {
      bus.emit("voice.set_mode", { mode: "wake_token_open_world" });
    }
  }

  function getKwsBootErrorReason(receiverRuntime) {
    const provider = resolveKwsProvider(receiverRuntime);
    const status = provider && typeof provider.getStatus === "function"
      ? provider.getStatus()
      : null;
    return status && status.micError ? String(status.micError) : "kws_link_start_failed";
  }

  async function bootNow(receiverRuntime) {
    if (!receiverRuntime) return false;
    if (typeof receiverRuntime.setKwsBackend === "function") await receiverRuntime.setKwsBackend(DEFAULT_KWS_BACKEND_KEY);
    if (typeof receiverRuntime.setVoiceEngine === "function") receiverRuntime.setVoiceEngine();
    const micOk = (typeof receiverRuntime.setKwsMicEnabled === "function")
      ? await receiverRuntime.setKwsMicEnabled(true)
      : true;
    if (micOk === false) throw new Error(getKwsBootErrorReason(receiverRuntime));

    const provider = resolveKwsProvider(receiverRuntime);
    if (provider && typeof provider.setEnabled === "function") provider.setEnabled(true);
    if (provider && typeof provider.setMode === "function") provider.setMode("active");
    emitWakeMode(receiverRuntime);

    if (typeof callbacks.onBootSuccess === "function") callbacks.onBootSuccess(receiverRuntime);
    return true;
  }

  function bootAndAutostart(receiverRuntime) {
    if (!receiverRuntime) return;
    Promise.resolve()
      .then(() => bootNow(receiverRuntime))
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
