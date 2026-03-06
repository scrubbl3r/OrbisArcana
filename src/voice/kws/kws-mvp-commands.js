export function createKwsMvpCommands({
  kwsRuntimeController,
  defaultBackendKey = "openwakeword_browser",
  getCurrentBackendKey = () => String(defaultBackendKey || "openwakeword_browser"),
  setCurrentBackendKey = () => {},
} = {}) {
  return {
    setVoiceEngine() {
      if (!kwsRuntimeController || typeof kwsRuntimeController.setVoiceEngine !== "function") return false;
      return kwsRuntimeController.setVoiceEngine();
    },
    async setKwsBackend(key = defaultBackendKey) {
      if (!kwsRuntimeController || typeof kwsRuntimeController.setKwsBackend !== "function") return false;
      const ok = await kwsRuntimeController.setKwsBackend(key);
      const current = typeof getCurrentBackendKey === "function"
        ? getCurrentBackendKey()
        : String(defaultBackendKey || "openwakeword_browser");
      const next = (kwsRuntimeController && typeof kwsRuntimeController.getBackendKey === "function")
        ? kwsRuntimeController.getBackendKey()
        : current;
      if (typeof setCurrentBackendKey === "function") setCurrentBackendKey(next);
      return ok;
    },
    setKwsParserConfig(next = {}) {
      if (!kwsRuntimeController || typeof kwsRuntimeController.setKwsParserConfig !== "function") return null;
      return kwsRuntimeController.setKwsParserConfig(next);
    },
    setKwsBackendConfig(next = {}) {
      if (!kwsRuntimeController || typeof kwsRuntimeController.setKwsBackendConfig !== "function") return null;
      return kwsRuntimeController.setKwsBackendConfig(next);
    },
    async setKwsMicEnabled(next) {
      if (!kwsRuntimeController || typeof kwsRuntimeController.setKwsMicEnabled !== "function") return false;
      return kwsRuntimeController.setKwsMicEnabled(next);
    },
  };
}
