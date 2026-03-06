export function bootstrapKwsVoiceRuntime({
  eventBus,
  createKwsProvider,
  createVoiceProviderManager,
  createOpenWakeWordBrowserBackendFactory,
  kwsRuntimeController,
  defaultBackendKey = "openwakeword_browser",
  defaultVoiceEngine = "kws",
  syncKwsTuneUiFromStatus,
  refreshKwsMicBtn,
} = {}) {
  let kwsVoiceProvider = null;
  let voiceProviderManager = null;
  let kwsBackendFactories = Object.create(null);
  let kwsBackendKey = String(defaultBackendKey || "openwakeword_browser");

  if (typeof createKwsProvider === "function") {
    const openWakeWordBrowserBackendFactory =
      (typeof createOpenWakeWordBrowserBackendFactory === "function")
        ? createOpenWakeWordBrowserBackendFactory()
        : null;
    kwsBackendFactories = {
      openwakeword_browser: {
        factory: openWakeWordBrowserBackendFactory,
        requiresMic: true,
        label: "openwakeword-browser",
      },
    };
    kwsBackendKey = String(defaultBackendKey || "openwakeword_browser");
    const selectedBackend = kwsBackendFactories[kwsBackendKey] || kwsBackendFactories.openwakeword_browser || null;
    kwsVoiceProvider = createKwsProvider({
      eventBus,
      shadow: true,
      backendFactory: selectedBackend && typeof selectedBackend.factory === "function"
        ? selectedBackend.factory
        : null,
      backendConfig: {
        requiresMic: !(selectedBackend && selectedBackend.requiresMic === false),
        label: selectedBackend && selectedBackend.label ? selectedBackend.label : "kws-backend",
      },
    });
    if (kwsRuntimeController && typeof kwsRuntimeController.setBackendFactories === "function") {
      kwsRuntimeController.setBackendFactories(kwsBackendFactories, kwsBackendKey);
    }
    if (kwsRuntimeController && typeof kwsRuntimeController.setKwsVoiceProvider === "function") {
      kwsRuntimeController.setKwsVoiceProvider(kwsVoiceProvider);
    }
  }

  if (typeof createVoiceProviderManager === "function") {
    voiceProviderManager = createVoiceProviderManager({
      providers: {
        ...(kwsVoiceProvider ? { kws: kwsVoiceProvider } : {}),
      },
      activeId: kwsVoiceProvider ? "kws" : "",
    });
    if (kwsRuntimeController && typeof kwsRuntimeController.setVoiceProviderManager === "function") {
      kwsRuntimeController.setVoiceProviderManager(voiceProviderManager);
    }
  }

  if (voiceProviderManager && typeof voiceProviderManager.start === "function") {
    voiceProviderManager.start();
  }

  // Initialize KWS provider eagerly; default engine may be live KWS.
  if (kwsVoiceProvider) {
    if (typeof kwsVoiceProvider.setMode === "function") {
      kwsVoiceProvider.setMode(String(defaultVoiceEngine || "kws") === "kws" ? "active" : "shadow");
    }
    if (typeof kwsVoiceProvider.start === "function") kwsVoiceProvider.start();
    if (typeof kwsVoiceProvider.setEnabled === "function") kwsVoiceProvider.setEnabled(true);
    if (typeof kwsVoiceProvider.getStatus === "function" && typeof syncKwsTuneUiFromStatus === "function") {
      syncKwsTuneUiFromStatus(kwsVoiceProvider.getStatus());
    }
    if (typeof refreshKwsMicBtn === "function") refreshKwsMicBtn();
  }

  return {
    kwsVoiceProvider,
    voiceProviderManager,
    kwsBackendKey,
  };
}
