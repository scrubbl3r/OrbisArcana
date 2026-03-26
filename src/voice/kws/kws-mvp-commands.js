export function createKwsMvpCommands({
  kwsRuntimeController,
  kwsListenPolicyController,
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
    setKwsWordParserConfig(next = {}) {
      if (!kwsRuntimeController) return null;
      if (typeof kwsRuntimeController.setKwsWordParserConfig === "function") {
        return kwsRuntimeController.setKwsWordParserConfig(next);
      }
      if (typeof kwsRuntimeController.setKwsParserConfig === "function") {
        return kwsRuntimeController.setKwsParserConfig(next);
      }
      return null;
    },
    setKwsParserConfig(next = {}) {
      if (!kwsRuntimeController) return null;
      if (typeof kwsRuntimeController.setKwsParserConfig === "function") {
        return kwsRuntimeController.setKwsParserConfig(next);
      }
      if (typeof kwsRuntimeController.setKwsWordParserConfig === "function") {
        return kwsRuntimeController.setKwsWordParserConfig(next);
      }
      return null;
    },
    setKwsBackendConfig(next = {}) {
      if (!kwsRuntimeController || typeof kwsRuntimeController.setKwsBackendConfig !== "function") return null;
      return kwsRuntimeController.setKwsBackendConfig(next);
    },
    setKwsListenPolicyMode(nextMode = "B") {
      if (!kwsListenPolicyController || typeof kwsListenPolicyController.setMode !== "function") return null;
      return kwsListenPolicyController.setMode(nextMode);
    },
    getKwsListenPolicyStatus() {
      if (!kwsListenPolicyController || typeof kwsListenPolicyController.getStatus !== "function") return null;
      return kwsListenPolicyController.getStatus();
    },
    async setKwsMicEnabled(next) {
      if (!kwsRuntimeController || typeof kwsRuntimeController.setKwsMicEnabled !== "function") return false;
      return kwsRuntimeController.setKwsMicEnabled(next);
    },
  };
}
