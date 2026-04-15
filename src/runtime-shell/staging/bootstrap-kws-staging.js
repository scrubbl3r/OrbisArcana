export function bootstrapKwsStaging({
  createKwsRuntimeConfig = null,
  createKwsReceiverBridge,
  createKwsPanelController,
  createKwsRuntimeController,
  createKwsBootOrchestrator,
  createDevStagingPanelElements,
  getKwsWordProvider = () => null,
  getKwsVoiceProvider = () => null,
  getMvp = () => null,
  readTuneFromUi = () => ({ inferThreshold: null, inferCooldownMs: null }),
  refreshKwsMicBtn = () => {},
  readout = {},
  runtime = {},
} = {}) {
  const next = {
    defaultVoiceEngine: String(runtime.defaultVoiceEngine || "kws"),
    defaultBackendKey: String(runtime.defaultBackendKey || "openwakeword"),
    autostartRetryMs: Math.max(250, Number(runtime.autostartRetryMs) || 2000),
    autostartMaxMs: Math.max(1000, Number(runtime.autostartMaxMs) || 15000),
    autostartRekickMs: Math.max(250, Number(runtime.autostartRekickMs) || 4000),
    startStallMs: Math.max(1000, Number(runtime.startStallMs) || 8000),
    listenPolicyMode: String(runtime.listenPolicyMode || "A").trim().toUpperCase() || "A",
    gateTimeoutMs: Math.max(100, Number(runtime.gateTimeoutMs) || 1500),
    readoutTickMs: Math.max(100, Number(runtime.readoutTickMs) || 250),
    rowTop: Array.isArray(runtime.rowTop) ? runtime.rowTop.slice() : [],
    rowBottom: Array.isArray(runtime.rowBottom) ? runtime.rowBottom.slice() : [],
    wakeWindowTokens: Array.isArray(runtime.wakeWindowTokens) ? runtime.wakeWindowTokens.slice() : [],
    axisTokens: Array.isArray(runtime.axisTokens) ? runtime.axisTokens.slice() : [],
    wakeTokens: Array.isArray(runtime.wakeTokens) ? runtime.wakeTokens.slice() : [],
    wakeRequiredTokens: Array.isArray(runtime.wakeRequiredTokens) ? runtime.wakeRequiredTokens.slice() : [],
    pathBoardWords: Array.isArray(runtime.pathBoardWords)
      ? runtime.pathBoardWords.map((entry) => ({ ...entry }))
      : [],
    pathBoardTrailRows: Array.isArray(runtime.pathBoardTrailRows)
      ? runtime.pathBoardTrailRows.map((row) => ({
        ...row,
        steps: Array.isArray(row && row.steps) ? row.steps.map((entry) => ({ ...entry })) : [],
      }))
      : [],
    spinWordByAxis: (runtime.spinWordByAxis && typeof runtime.spinWordByAxis === "object")
      ? Object.freeze({ ...runtime.spinWordByAxis })
      : Object.freeze({}),
    logTokens: new Set(Array.isArray(runtime.logTokens) ? runtime.logTokens : []),
    tempUngatedTokens: new Set(Array.isArray(runtime.tempUngatedTokens) ? runtime.tempUngatedTokens : []),
    tokenCanonicalMap: (runtime.tokenCanonicalMap && typeof runtime.tokenCanonicalMap === "object")
      ? runtime.tokenCanonicalMap
      : Object.freeze({}),
    configDebugLine: "",
  };

  if (typeof createKwsRuntimeConfig === "function") {
    const kwsConfig = createKwsRuntimeConfig();
    if (kwsConfig && typeof kwsConfig === "object") {
      next.defaultVoiceEngine = String(kwsConfig.defaultVoiceEngine || next.defaultVoiceEngine);
      next.defaultBackendKey = String(kwsConfig.defaultBackendKey || next.defaultBackendKey);
      next.autostartRetryMs = Math.max(250, Number(kwsConfig.autostartRetryMs) || next.autostartRetryMs);
      next.autostartMaxMs = Math.max(1000, Number(kwsConfig.autostartMaxMs) || next.autostartMaxMs);
      next.autostartRekickMs = Math.max(250, Number(kwsConfig.autostartRekickMs) || next.autostartRekickMs);
      next.startStallMs = Math.max(1000, Number(kwsConfig.startStallMs) || next.startStallMs);
      next.listenPolicyMode = String(kwsConfig.listenPolicyMode || next.listenPolicyMode || "A").trim().toUpperCase() || "A";
      next.gateTimeoutMs = Math.max(100, Number(kwsConfig.gateTimeoutMs) || next.gateTimeoutMs);
      next.readoutTickMs = Math.max(100, Number(kwsConfig.readoutTickMs) || next.readoutTickMs);
      next.rowTop = Array.isArray(kwsConfig.rowTop) ? kwsConfig.rowTop.slice() : next.rowTop;
      next.rowBottom = Array.isArray(kwsConfig.rowBottom) ? kwsConfig.rowBottom.slice() : next.rowBottom;
      next.wakeWindowTokens = Array.isArray(kwsConfig.wakeWindowTokens) ? kwsConfig.wakeWindowTokens.slice() : next.wakeWindowTokens;
      next.axisTokens = Array.isArray(kwsConfig.axisTokens) ? kwsConfig.axisTokens.slice() : next.axisTokens;
      next.wakeTokens = Array.isArray(kwsConfig.wakeTokens) ? kwsConfig.wakeTokens.slice() : next.wakeTokens;
      next.wakeRequiredTokens = Array.isArray(kwsConfig.wakeRequiredTokens)
        ? kwsConfig.wakeRequiredTokens.slice()
        : next.wakeRequiredTokens;
      next.pathBoardWords = Array.isArray(kwsConfig.pathBoardWords)
        ? kwsConfig.pathBoardWords.map((entry) => ({ ...entry }))
        : next.pathBoardWords;
      next.pathBoardTrailRows = Array.isArray(kwsConfig.pathBoardTrailRows)
        ? kwsConfig.pathBoardTrailRows.map((row) => ({
          ...row,
          steps: Array.isArray(row && row.steps) ? row.steps.map((entry) => ({ ...entry })) : [],
        }))
        : next.pathBoardTrailRows;
      next.spinWordByAxis = (kwsConfig.spinWordByAxis && typeof kwsConfig.spinWordByAxis === "object")
        ? Object.freeze({ ...kwsConfig.spinWordByAxis })
        : next.spinWordByAxis;
      next.logTokens = new Set(Array.isArray(kwsConfig.logTokens) ? kwsConfig.logTokens : Array.from(next.logTokens));
      next.tempUngatedTokens = new Set(
        Array.isArray(kwsConfig.tempUngatedTokens) ? kwsConfig.tempUngatedTokens : Array.from(next.tempUngatedTokens)
      );
      next.tokenCanonicalMap = (kwsConfig.tokenCanonicalMap && typeof kwsConfig.tokenCanonicalMap === "object")
        ? kwsConfig.tokenCanonicalMap
        : next.tokenCanonicalMap;
      next.configDebugLine = `cfg.rowTop=${next.rowTop.join(",")}`;
    }
  }

  const kwsBridge = createKwsReceiverBridge({
    getPanelController: () => kwsPanelController,
    getRuntimeController: () => kwsRuntimeController,
    defaultGateTimeoutMs: next.gateTimeoutMs,
  });

  let kwsPanelController = createKwsPanelController({
    els: createDevStagingPanelElements(),
    constants: {
      defaultGateTimeoutMs: next.gateTimeoutMs,
      startStallMs: next.startStallMs,
      readoutTickMs: next.readoutTickMs,
      rowTop: next.rowTop,
      rowBottom: next.rowBottom,
      wakeWindowTokens: next.wakeWindowTokens,
      axisTokens: next.axisTokens,
      wakeTokens: next.wakeTokens,
      wakeRequiredTokens: next.wakeRequiredTokens,
      pathBoardWords: next.pathBoardWords,
      pathBoardTrailRows: next.pathBoardTrailRows,
      spinWordByAxis: next.spinWordByAxis,
      logTokens: Array.from(next.logTokens),
      tempUngatedTokens: Array.from(next.tempUngatedTokens),
      tokenCanonicalMap: next.tokenCanonicalMap,
    },
    getKwsWordProvider,
    getKwsVoiceProvider,
    onGateOpened: (payload = {}) => {
      const mvp = getMvp();
      if (mvp && mvp.eventBus) mvp.eventBus.emit("voice.gate_opened", payload);
    },
    onGateClosed: (payload = {}) => {
      const mvp = getMvp();
      if (mvp && mvp.eventBus) mvp.eventBus.emit("voice.gate_closed", payload);
    },
    onApplyTune: (nextTune = {}) => {
      const mvp = getMvp();
      if (!mvp || typeof mvp.setKwsBackendConfig !== "function") return null;
      return mvp.setKwsBackendConfig(nextTune);
    },
    getListenPolicyStatus: () => {
      const mvp = getMvp();
      if (!mvp || typeof mvp.getKwsListenPolicyStatus !== "function") return null;
      return mvp.getKwsListenPolicyStatus();
    },
  });

  const kwsTokenUiState = kwsPanelController && typeof kwsPanelController.getUiState === "function"
    ? kwsPanelController.getUiState()
    : null;

  if (kwsPanelController && typeof kwsPanelController.bindTuneApplyButton === "function") {
    kwsPanelController.bindTuneApplyButton();
  }
  if (kwsPanelController && typeof kwsPanelController.bindLogPopupButton === "function") {
    kwsPanelController.bindLogPopupButton();
  }
  if (kwsPanelController && typeof kwsPanelController.bindPathBoardPopupButton === "function") {
    kwsPanelController.bindPathBoardPopupButton();
  }
  if (kwsPanelController && typeof kwsPanelController.bindPathBoardDebugToggle === "function") {
    kwsPanelController.bindPathBoardDebugToggle();
  }

  kwsBridge.startReadoutTick();
  if (next.configDebugLine) kwsBridge.pushLogLine(next.configDebugLine, "muted");

  let kwsRuntimeController = createKwsRuntimeController({
    constants: {
      defaultBackendKey: next.defaultBackendKey,
      defaultVoiceEngine: next.defaultVoiceEngine,
      autostartRetryMs: next.autostartRetryMs,
      autostartMaxMs: next.autostartMaxMs,
      autostartRekickMs: next.autostartRekickMs,
    },
    callbacks: {
      readTuneFromUi,
      syncTuneUiFromStatus: (status) => kwsBridge.syncTuneUiFromStatus(status),
      refreshMicBtn: () => refreshKwsMicBtn(),
      updateReadout: () => kwsBridge.updateReadout(),
      setDebugMode: (mode) => {
        if (typeof readout.setDebugMode === "function") readout.setDebugMode(mode);
      },
      setDebugBackend: (key) => {
        if (typeof readout.setDebugBackend === "function") readout.setDebugBackend(key);
      },
      emitVoiceSetMode: (mode) => {
        const mvp = getMvp();
        const bus = mvp && mvp.eventBus;
        if (bus && typeof bus.emit === "function" && readout.receiverEvents && readout.receiverEvents.EVT_VOICE_SET_MODE) {
          bus.emit(readout.receiverEvents.EVT_VOICE_SET_MODE, { mode });
        }
      },
    },
  });

  const kwsBootOrchestrator = createKwsBootOrchestrator({
    constants: {
      defaultBackendKey: next.defaultBackendKey,
      defaultVoiceEngine: next.defaultVoiceEngine,
    },
    callbacks: {
      emitWakeMode: (instance) => {
        if (instance && instance.eventBus && readout.receiverEvents && readout.receiverEvents.EVT_VOICE_SET_MODE) {
          instance.eventBus.emit(readout.receiverEvents.EVT_VOICE_SET_MODE, { mode: "wake_token_open_world" });
        }
      },
      onBootSuccess: () => {
        kwsBridge.updateReadout();
        refreshKwsMicBtn();
      },
      onBootFailed: (err) => {
        console.warn("KWS boot auto-init failed:", err);
      },
      startAutostartWatchdog: () => {
        kwsBridge.startAutostartWatchdog();
      },
    },
  });

  return {
    kwsBridge,
    kwsPanelController,
    kwsTokenUiState,
    kwsRuntimeController,
    kwsBootOrchestrator,
    runtimeConfig: next,
  };
}
