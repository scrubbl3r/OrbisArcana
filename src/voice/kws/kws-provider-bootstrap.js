import { ACTIVE_WORDS_BY_ID } from "../wordbook.js?v=20260515d";

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
  let kwsWordProvider = null;
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
    kwsWordProvider = createKwsProvider({
      eventBus,
      shadow: true,
      // Seed parser aliases from canonical word inventory so all words match.
      words: Object.freeze(Object.values(ACTIVE_WORDS_BY_ID || Object.create(null))),
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
    if (kwsRuntimeController && typeof kwsRuntimeController.setKwsWordProvider === "function") {
      kwsRuntimeController.setKwsWordProvider(kwsWordProvider);
    } else if (kwsRuntimeController && typeof kwsRuntimeController.setKwsVoiceProvider === "function") {
      kwsRuntimeController.setKwsVoiceProvider(kwsWordProvider);
    }
  }

  if (typeof createVoiceProviderManager === "function") {
    voiceProviderManager = createVoiceProviderManager({
      providers: {
        ...(kwsWordProvider ? { kws: kwsWordProvider } : {}),
      },
      activeId: kwsWordProvider ? "kws" : "",
    });
    if (kwsRuntimeController && typeof kwsRuntimeController.setVoiceProviderManager === "function") {
      kwsRuntimeController.setVoiceProviderManager(voiceProviderManager);
    }
  }

  if (voiceProviderManager && typeof voiceProviderManager.start === "function") {
    voiceProviderManager.start();
  }

  // Initialize KWS provider eagerly; default engine may be live KWS.
  if (kwsWordProvider) {
    if (typeof kwsWordProvider.setMode === "function") {
      kwsWordProvider.setMode(String(defaultVoiceEngine || "kws") === "kws" ? "active" : "shadow");
    }
    if (typeof kwsWordProvider.start === "function") kwsWordProvider.start();
    if (typeof kwsWordProvider.setEnabled === "function") kwsWordProvider.setEnabled(true);
    if (typeof kwsWordProvider.getStatus === "function" && typeof syncKwsTuneUiFromStatus === "function") {
      syncKwsTuneUiFromStatus(kwsWordProvider.getStatus());
    }
    if (typeof refreshKwsMicBtn === "function") refreshKwsMicBtn();
  }

  return {
    kwsWordProvider,
    kwsVoiceProvider: kwsWordProvider,
    voiceProviderManager,
    kwsBackendKey,
  };
}
