export function createKwsRuntimeController({
  constants = {},
  callbacks = {},
} = {}) {
  const DEFAULT_KWS_BACKEND_KEY = String(constants.defaultBackendKey || "openwakeword_browser");
  const DEFAULT_VOICE_ENGINE = String(constants.defaultVoiceEngine || "kws");
  const DEFAULT_KWS_AUTOSTART_RETRY_MS = Math.max(250, Number(constants.autostartRetryMs) || 2000);
  const DEFAULT_KWS_AUTOSTART_MAX_MS = Math.max(1000, Number(constants.autostartMaxMs) || 120000);
  const DEFAULT_KWS_AUTOSTART_REKICK_MS = Math.max(250, Number(constants.autostartRekickMs) || 5000);

  let kwsVoiceProvider = null;
  let voiceProviderManager = null;
  let kwsBackendFactories = Object.create(null);
  let kwsBackendKey = DEFAULT_KWS_BACKEND_KEY;

  let kwsAutostartTimer = 0;
  let kwsAutostartInFlight = false;
  let kwsAutostartStartedAtMs = 0;
  let kwsAutostartLastKickAtMs = 0;

  function readTuneFromUi() {
    if (typeof callbacks.readTuneFromUi !== "function") return { inferThreshold: null, inferCooldownMs: null };
    const tune = callbacks.readTuneFromUi();
    return (tune && typeof tune === "object") ? tune : { inferThreshold: null, inferCooldownMs: null };
  }

  function syncTuneUiFromStatus(status) {
    if (typeof callbacks.syncTuneUiFromStatus === "function") callbacks.syncTuneUiFromStatus(status);
  }

  function refreshMicBtn() {
    if (typeof callbacks.refreshMicBtn === "function") callbacks.refreshMicBtn();
  }

  function updateReadout() {
    if (typeof callbacks.updateReadout === "function") callbacks.updateReadout();
  }

  function setDebugMode(mode) {
    if (typeof callbacks.setDebugMode === "function") callbacks.setDebugMode(mode);
  }

  function setDebugBackend(key) {
    if (typeof callbacks.setDebugBackend === "function") callbacks.setDebugBackend(key);
  }

  function emitVoiceSetMode(mode) {
    if (typeof callbacks.emitVoiceSetMode === "function") callbacks.emitVoiceSetMode(mode);
  }

  function hasKwsAudioFlow(status) {
    const s = status && typeof status === "object" ? status : null;
    if (!s) return false;
    const b = s.audioBackendStatus && typeof s.audioBackendStatus === "object" ? s.audioBackendStatus : null;
    const chunks = Number((b && b.audioChunksSent) || 0);
    const produced = Number((b && b.audioWorkerFramesProduced) || 0);
    const infer = Number((b && b.inferInferences) || 0);
    return chunks > 0 || produced > 0 || infer > 0;
  }

  function hasKwsInferFlow(status) {
    const s = status && typeof status === "object" ? status : null;
    if (!s) return false;
    const b = s.audioBackendStatus && typeof s.audioBackendStatus === "object" ? s.audioBackendStatus : null;
    if (!b) return false;
    const inferReady = !!b.inferReady;
    const infer = Number(b.inferInferences || 0);
    return inferReady || infer > 0;
  }

  function clearAutostartWatchdog() {
    if (!kwsAutostartTimer) return;
    clearInterval(kwsAutostartTimer);
    kwsAutostartTimer = 0;
    kwsAutostartInFlight = false;
    kwsAutostartLastKickAtMs = 0;
  }

  function setKwsVoiceProvider(nextProvider) {
    kwsVoiceProvider = nextProvider || null;
  }

  function setVoiceProviderManager(nextManager) {
    voiceProviderManager = nextManager || null;
  }

  function setBackendFactories(nextFactories = Object.create(null), activeKey = DEFAULT_KWS_BACKEND_KEY) {
    kwsBackendFactories = (nextFactories && typeof nextFactories === "object") ? nextFactories : Object.create(null);
    kwsBackendKey = String(activeKey || DEFAULT_KWS_BACKEND_KEY);
    setDebugBackend(kwsBackendKey);
  }

  function getKwsVoiceProvider() {
    return kwsVoiceProvider;
  }

  async function setKwsBackend(key = DEFAULT_KWS_BACKEND_KEY) {
    const nextKey = String(key || DEFAULT_KWS_BACKEND_KEY);
    kwsBackendKey = nextKey;
    setDebugBackend(nextKey);
    const spec = kwsBackendFactories[nextKey] || null;
    if (!kwsVoiceProvider || typeof kwsVoiceProvider.setBackend !== "function") {
      refreshMicBtn();
      updateReadout();
      return false;
    }
    await kwsVoiceProvider.setBackend(spec && typeof spec.factory === "function" ? spec.factory : null, {
      requiresMic: !(spec && spec.requiresMic === false),
      label: spec && spec.label ? spec.label : nextKey,
    });
    if (nextKey === "openwakeword_browser" && typeof kwsVoiceProvider.setBackendConfig === "function") {
      const backendStatusNow = kwsVoiceProvider && typeof kwsVoiceProvider.getStatus === "function"
        ? kwsVoiceProvider.getStatus()
        : null;
      const backendNow = backendStatusNow && backendStatusNow.audioBackendStatus ? backendStatusNow.audioBackendStatus : backendStatusNow;
      const tune = readTuneFromUi();
      const thFromUi = tune.inferThreshold;
      const cdFromUi = tune.inferCooldownMs;
      const thFromBackend = Number(backendNow && backendNow.inferThreshold);
      const cdFromBackend = Number(backendNow && backendNow.inferCooldownMs);
      const statusAfterApply = kwsVoiceProvider.setBackendConfig({
        ...(thFromUi != null
          ? { inferThreshold: thFromUi }
          : (Number.isFinite(thFromBackend) ? { inferThreshold: thFromBackend } : {})),
        ...(cdFromUi != null
          ? { inferCooldownMs: cdFromUi }
          : (Number.isFinite(cdFromBackend) ? { inferCooldownMs: cdFromBackend } : {})),
      });
      syncTuneUiFromStatus(statusAfterApply && statusAfterApply.audioBackendStatus ? statusAfterApply.audioBackendStatus : statusAfterApply);
    }
    if (spec && typeof spec.factory === "function" && typeof kwsVoiceProvider.setMicEnabled === "function") {
      await kwsVoiceProvider.setMicEnabled(true);
    }
    if (nextKey === "openwakeword_browser" && typeof kwsVoiceProvider.setBackendConfig === "function") {
      const backendStatusNow = kwsVoiceProvider && typeof kwsVoiceProvider.getStatus === "function"
        ? kwsVoiceProvider.getStatus()
        : null;
      const backendNow = backendStatusNow && backendStatusNow.audioBackendStatus ? backendStatusNow.audioBackendStatus : backendStatusNow;
      const tune = readTuneFromUi();
      const thFromUi = tune.inferThreshold;
      const cdFromUi = tune.inferCooldownMs;
      const thFromBackend = Number(backendNow && backendNow.inferThreshold);
      const cdFromBackend = Number(backendNow && backendNow.inferCooldownMs);
      const statusAfterStartApply = kwsVoiceProvider.setBackendConfig({
        ...(thFromUi != null
          ? { inferThreshold: thFromUi }
          : (Number.isFinite(thFromBackend) ? { inferThreshold: thFromBackend } : {})),
        ...(cdFromUi != null
          ? { inferCooldownMs: cdFromUi }
          : (Number.isFinite(cdFromBackend) ? { inferCooldownMs: cdFromBackend } : {})),
      });
      syncTuneUiFromStatus(statusAfterStartApply && statusAfterStartApply.audioBackendStatus ? statusAfterStartApply.audioBackendStatus : statusAfterStartApply);
    }
    refreshMicBtn();
    updateReadout();
    return true;
  }

  function setKwsParserConfig(next = {}) {
    if (!kwsVoiceProvider || typeof kwsVoiceProvider.setParserConfig !== "function") return null;
    return kwsVoiceProvider.setParserConfig(next);
  }

  function setKwsBackendConfig(next = {}) {
    if (!kwsVoiceProvider || typeof kwsVoiceProvider.setBackendConfig !== "function") return null;
    return kwsVoiceProvider.setBackendConfig(next);
  }

  async function setKwsMicEnabled(next) {
    if (!kwsVoiceProvider || typeof kwsVoiceProvider.setMicEnabled !== "function") return false;
    const ok = await kwsVoiceProvider.setMicEnabled(!!next);
    refreshMicBtn();
    updateReadout();
    return !!ok;
  }

  function setVoiceEngine() {
    setDebugMode(DEFAULT_VOICE_ENGINE);
    updateReadout();
    if (!voiceProviderManager) return false;
    if (kwsVoiceProvider) {
      kwsVoiceProvider.setMode("active");
      kwsVoiceProvider.start && kwsVoiceProvider.start();
      kwsVoiceProvider.setEnabled && kwsVoiceProvider.setEnabled(true);
    }
    const ok = !!(voiceProviderManager.setActive && voiceProviderManager.setActive("kws"));
    emitVoiceSetMode("wake_token_open_world");
    return ok;
  }

  function startAutostartWatchdog() {
    if (!kwsVoiceProvider || typeof kwsVoiceProvider.getStatus !== "function") return;
    clearAutostartWatchdog();
    kwsAutostartStartedAtMs = performance.now();
    kwsAutostartTimer = setInterval(async () => {
      if (kwsAutostartInFlight) return;
      const elapsed = Math.max(0, performance.now() - Number(kwsAutostartStartedAtMs || 0));
      if (elapsed > DEFAULT_KWS_AUTOSTART_MAX_MS) {
        clearAutostartWatchdog();
        return;
      }
      const s = kwsVoiceProvider.getStatus();
      const err = String(s && s.micError || "").toLowerCase();
      if (err.includes("notallowederror") || err.includes("permission")) {
        clearAutostartWatchdog();
        return;
      }
      if (s && s.micRunning && hasKwsAudioFlow(s) && hasKwsInferFlow(s)) {
        clearAutostartWatchdog();
        return;
      }
      const nowPerf = performance.now();
      if ((nowPerf - Number(kwsAutostartLastKickAtMs || 0)) < DEFAULT_KWS_AUTOSTART_REKICK_MS) return;
      kwsAutostartInFlight = true;
      try {
        const backendLabel = String(s && s.backendLabel || "").toLowerCase();
        const backendLooksBrowser = backendLabel.includes("openwakeword-browser");
        const backendStatus = s && s.audioBackendStatus && typeof s.audioBackendStatus === "object"
          ? s.audioBackendStatus
          : null;
        const inferReady = !!(backendStatus && backendStatus.inferReady);
        if (!backendLooksBrowser || !inferReady) {
          await setKwsBackend(DEFAULT_KWS_BACKEND_KEY);
        }
        setVoiceEngine();
        await setKwsMicEnabled(true);
        kwsAutostartLastKickAtMs = nowPerf;
        refreshMicBtn();
        updateReadout();
      } catch (_) {
        // Retry loop continues until success or stop conditions.
      } finally {
        kwsAutostartInFlight = false;
      }
    }, DEFAULT_KWS_AUTOSTART_RETRY_MS);
  }

  return {
    setKwsVoiceProvider,
    setVoiceProviderManager,
    setBackendFactories,
    getKwsVoiceProvider,
    clearAutostartWatchdog,
    startAutostartWatchdog,
    setVoiceEngine,
    setKwsBackend,
    setKwsParserConfig,
    setKwsBackendConfig,
    setKwsMicEnabled,
    getBackendKey: () => kwsBackendKey,
  };
}
