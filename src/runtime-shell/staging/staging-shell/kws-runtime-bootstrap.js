export async function bootstrapShellKwsRuntimeBase({
  sharedModules = null,
  runtime = null,
  devRefs = null,
  createDevStagingPanelElements = () => ({}),
  readNumberInputOrNull = () => null,
} = {}) {
  if (!sharedModules || !runtime || !devRefs) return null;

  const createEventBus = sharedModules.eventBusModule && sharedModules.eventBusModule.createEventBus;
  const bootstrapKwsStaging =
    sharedModules.bootstrapKwsStagingModule &&
    sharedModules.bootstrapKwsStagingModule.bootstrapKwsStaging;
  const createKwsPanelController =
    sharedModules.kwsPanelControllerModule &&
    sharedModules.kwsPanelControllerModule.createKwsPanelController;
  const createKwsRuntimeController =
    sharedModules.kwsRuntimeControllerModule &&
    sharedModules.kwsRuntimeControllerModule.createKwsRuntimeController;
  const createKwsBootOrchestrator =
    sharedModules.kwsBootOrchestratorModule &&
    sharedModules.kwsBootOrchestratorModule.createKwsBootOrchestrator;
  const createKwsListenPolicyController =
    sharedModules.kwsListenPolicyControllerModule &&
    sharedModules.kwsListenPolicyControllerModule.createKwsListenPolicyController;
  const bootstrapKwsVoiceRuntime =
    sharedModules.kwsProviderBootstrapModule &&
    sharedModules.kwsProviderBootstrapModule.bootstrapKwsVoiceRuntime;
  const createKwsRuntimeConfig =
    sharedModules.kwsConfigModule &&
    sharedModules.kwsConfigModule.createKwsRuntimeConfig;
  const createKwsReceiverBridge =
    sharedModules.kwsReceiverBridgeModule &&
    sharedModules.kwsReceiverBridgeModule.createKwsReceiverBridge;
  const createKwsRuntimeCommands =
    sharedModules.kwsRuntimeCommandsModule &&
    sharedModules.kwsRuntimeCommandsModule.createKwsRuntimeCommands;
  const receiverEventsModule = sharedModules.receiverEventsModule || {};
  const RECEIVER_EVENTS = {
    ...(receiverEventsModule.RECEIVER_EVENTS && typeof receiverEventsModule.RECEIVER_EVENTS === "object"
      ? receiverEventsModule.RECEIVER_EVENTS
      : {}),
  };
  const loadReceiverInitModules =
    sharedModules.receiverBootstrapModule &&
    sharedModules.receiverBootstrapModule.loadReceiverInitModules;

  if (
    typeof createEventBus !== "function" ||
    typeof bootstrapKwsStaging !== "function" ||
    typeof createKwsPanelController !== "function" ||
    typeof createKwsRuntimeController !== "function" ||
    typeof createKwsBootOrchestrator !== "function" ||
    typeof createKwsListenPolicyController !== "function" ||
    typeof bootstrapKwsVoiceRuntime !== "function" ||
    typeof createKwsRuntimeConfig !== "function" ||
    typeof createKwsReceiverBridge !== "function" ||
    typeof createKwsRuntimeCommands !== "function" ||
    typeof loadReceiverInitModules !== "function"
  ) {
    return null;
  }

  const receiverMods = await loadReceiverInitModules();
  const {
    createKwsProvider,
    createVoiceProviderManager,
    createOpenWakeWordBrowserBackendFactory,
  } = receiverMods || {};

  if (
    typeof createKwsProvider !== "function" ||
    typeof createVoiceProviderManager !== "function" ||
    typeof createOpenWakeWordBrowserBackendFactory !== "function"
  ) {
    return null;
  }

  let kwsWordProvider = null;
  let kwsVoiceProvider = null;
  let voiceProviderManager = null;
  let kwsListenPolicyController = null;
  let kwsBackendKey = "openwakeword_browser";
  const kwsDebugState = { mode: "kws", backend: "openwakeword_browser" };
  const eventBus = createEventBus();

  const {
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsRuntimeController,
    kwsBootOrchestrator,
    runtimeConfig,
  } = bootstrapKwsStaging({
    createKwsRuntimeConfig,
    createKwsReceiverBridge,
    createKwsPanelController,
    createKwsRuntimeController,
    createKwsBootOrchestrator,
    createDevStagingPanelElements: () => createDevStagingPanelElements(devRefs),
    getKwsWordProvider: () => kwsWordProvider,
    getKwsVoiceProvider: () => kwsVoiceProvider,
    getReceiverRuntime: () => runtime.receiverRuntime || runtime.mvp,
    readTuneFromUi: () => ({
      inferThreshold: readNumberInputOrNull(devRefs.kwsTokenThrInput),
      inferCooldownMs: readNumberInputOrNull(devRefs.kwsCooldownMsInput),
    }),
    refreshKwsMicBtn: () => {},
    readout: {
      setDebugMode: (mode) => { kwsDebugState.mode = String(mode || "kws"); },
      setDebugBackend: (key) => { kwsDebugState.backend = String(key || "openwakeword_browser"); },
      receiverEvents: RECEIVER_EVENTS,
    },
    runtime: {
      defaultVoiceEngine: "kws",
      defaultBackendKey: "openwakeword_browser",
    },
  });

  const kwsVoiceRuntime = bootstrapKwsVoiceRuntime({
    eventBus,
    createKwsProvider,
    createVoiceProviderManager,
    createOpenWakeWordBrowserBackendFactory,
    kwsRuntimeController,
    defaultBackendKey: runtimeConfig.defaultBackendKey,
    defaultVoiceEngine: runtimeConfig.defaultVoiceEngine,
    syncKwsTuneUiFromStatus: (status) => kwsBridge.syncTuneUiFromStatus(status),
    refreshKwsMicBtn: () => {},
  });

  kwsWordProvider = kwsVoiceRuntime.kwsWordProvider || kwsVoiceRuntime.kwsVoiceProvider || null;
  kwsVoiceProvider = kwsVoiceRuntime.kwsVoiceProvider || kwsVoiceRuntime.kwsWordProvider || null;
  voiceProviderManager = kwsVoiceRuntime.voiceProviderManager || null;
  kwsBackendKey = String(kwsVoiceRuntime.kwsBackendKey || runtimeConfig.defaultBackendKey || "openwakeword_browser");
  kwsDebugState.backend = kwsBackendKey;

  kwsListenPolicyController = createKwsListenPolicyController({
    eventBus,
    kwsRuntimeController,
    initialMode: String(runtimeConfig.listenPolicyMode || "A"),
    nowMs: () => Date.now(),
  });
  if (kwsListenPolicyController && typeof kwsListenPolicyController.start === "function") {
    kwsListenPolicyController.start();
  }

  if (kwsPanelController && typeof kwsPanelController.setManualListenableTokens === "function") {
    const initialPolicyStatus = (
      kwsListenPolicyController && typeof kwsListenPolicyController.getStatus === "function"
        ? kwsListenPolicyController.getStatus()
        : null
    );
    kwsPanelController.setManualListenableTokens(
      Array.isArray(initialPolicyStatus && initialPolicyStatus.listenableTokens)
        ? initialPolicyStatus.listenableTokens
        : []
    );
  }

  const kwsRuntimeCommands = createKwsRuntimeCommands({
    kwsRuntimeController,
    kwsListenPolicyController,
    defaultBackendKey: runtimeConfig.defaultBackendKey,
    getCurrentBackendKey: () => kwsBackendKey,
    setCurrentBackendKey: (nextBackendKey) => {
      kwsBackendKey = String(nextBackendKey || runtimeConfig.defaultBackendKey || "openwakeword_browser");
      kwsDebugState.backend = kwsBackendKey;
    },
  });

  return {
    eventBus,
    receiverMods,
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsRuntimeController,
    kwsBootOrchestrator,
    kwsWordProvider,
    kwsVoiceProvider,
    voiceProviderManager,
    kwsListenPolicyController,
    kwsRuntimeCommands,
    kwsDebugState,
    kwsBackendKey,
    runtimeConfig,
    receiverEvents: RECEIVER_EVENTS,
  };
}
