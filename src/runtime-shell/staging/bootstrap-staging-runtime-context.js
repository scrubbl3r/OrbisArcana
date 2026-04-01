export function bootstrapStagingRuntimeContext({
  createEventBus,
  createGameState,
  createOrbDamageVisualsRuntime,
  createAudioSystem,
  createInputSystemsBundle,
  createResourcesSystem,
  createSpellDispatchSystem,
  createRuleEnginePreviewSystem = null,
  createWorldSystem,
  createOrbSystemsBundle,
  createOrbSystem,
  createOrbFxSystem,
  els = {},
  IMPACT_TH = 0,
  INPUT_DYNAMICS_CFG = {},
  INPUT_GESTURE_CFG = {},
  ENERGY_BANK_CAP = 0,
  ENERGY_SHAKE_COST = 0,
  ENERGY_CHARGE_RATE_PPS = 0,
  ruleSchema = null,
  RULE_ENGINE_EXECUTE_ACTIONS = false,
  DEFAULT_KWS_LISTEN_POLICY_MODE = "A",
  STRICT_A_WAKE_WINDOW_PAD_MS = 0,
  kwsListenPolicyController = null,
  kwsBridge = null,
  RULE_CHAIN_TRACE_ENABLED = false,
  PHYS = {},
  worldItemSpawns = [],
  normalizeWorldItemSpawn = (value) => value,
  groundCenterWorld = () => 0,
  stageRect = () => ({ height: 0 }),
  pickupScreenY = (value) => value,
  getOrbRuntime = () => ({ yW: 0 }),
  getOrbScreenY = () => 0,
  axisToColor01 = () => 0,
  gestureHooks = {},
} = {}) {
  const eventBus = createEventBus();
  const gameState = createGameState({
    orb: {
      maxHealth: 300,
      health: 300,
      collisionDamage: 100,
      collisionThreshold: IMPACT_TH,
      collisionCooldownMs: 250,
    },
  });

  const orbDamageVisualsRuntime = createOrbDamageVisualsRuntime({ eventBus });
  const audioSystem = createAudioSystem({ eventBus });
  const inputSystemsBundle = createInputSystemsBundle({
    eventBus,
    dynamicsConfig: {
      stabilityAvgMs: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.avgMs,
      stabilityArmMs: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.armMs,
      stabilityOnThr: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.onThreshold,
      stabilityOffThr: INPUT_DYNAMICS_CFG.stability && INPUT_DYNAMICS_CFG.stability.offThreshold,
      variabilityAvgMs: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.avgMs,
      variabilityArmMs: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.armMs,
      variabilityOnThr: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.onThreshold,
      variabilityOffThr: INPUT_DYNAMICS_CFG.variability && INPUT_DYNAMICS_CFG.variability.offThreshold,
    },
    gestureConfig: {
      shakeCooldownMs: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.cooldownMs,
      shakeMode: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.mode,
      grooveShakeGate: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.grooveGate,
      shakeLampThr: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.lampThreshold,
      sdRecentMs: INPUT_GESTURE_CFG.shake && INPUT_GESTURE_CFG.shake.directionRecentMs,
      flatSpinDominanceOn: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceOn,
      flatSpinDominanceOff: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceOff,
      flatSpinDominanceGapOn: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceGapOn,
      flatSpinDominanceGapOff: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.dominanceGapOff,
      flatSpinOnHoldMs: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.onHoldMs,
      flatSpinOffHoldMs: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.offHoldMs,
      flatSpinGateRefreshMs: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.gateRefreshMs,
      flatSpinMinSpeed01: INPUT_GESTURE_CFG.flatSpin && INPUT_GESTURE_CFG.flatSpin.minSpeed01,
    },
    gestureHooks,
  });

  const inputSystem = inputSystemsBundle.inputSystem;
  const inputDynamicsSystem = inputSystemsBundle.inputDynamicsSystem;
  const inputGestureSystem = inputSystemsBundle.inputGestureSystem;
  const resourcesSystem = createResourcesSystem({
    eventBus,
    config: {
      energyBankCap: ENERGY_BANK_CAP,
      energyShakeCost: ENERGY_SHAKE_COST,
      energyChargeRatePps: ENERGY_CHARGE_RATE_PPS,
    },
  });

  const spellDispatchSystem = createSpellDispatchSystem({
    eventBus,
    resources: resourcesSystem,
    ruleEngineEnabled: (!ruleSchema || ruleSchema.enabled !== false) && RULE_ENGINE_EXECUTE_ACTIONS === true,
    allowLegacyFallbacks: false,
  });

  let ruleEnginePreviewSystem = null;
  if (typeof createRuleEnginePreviewSystem === "function" && ruleSchema) {
    ruleEnginePreviewSystem = createRuleEnginePreviewSystem({
      eventBus,
      schema: ruleSchema,
      executeActions: RULE_ENGINE_EXECUTE_ACTIONS,
      getWakeWindowPadMs: () => {
        const status = (kwsListenPolicyController && typeof kwsListenPolicyController.getStatus === "function")
          ? kwsListenPolicyController.getStatus()
          : null;
        const mode = String(status && status.mode || DEFAULT_KWS_LISTEN_POLICY_MODE).trim().toUpperCase();
        return mode === "A" ? STRICT_A_WAKE_WINDOW_PAD_MS : 0;
      },
    });
    if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      const rules = Array.isArray(ruleSchema.rules) ? ruleSchema.rules : [];
      const signals = Array.isArray(ruleSchema.signals) ? ruleSchema.signals : [];
      const hasWakeMain = rules.some((r) => String(r && r.id || "").trim().toLowerCase() === "wake_main");
      const hasTeleHome = rules.some((r) => String(r && r.id || "").trim().toLowerCase() === "tele_home");
      const orbisSignal = signals.find((s) => String(s && s.id || "").trim().toLowerCase() === "spell.orbis");
      const debugBootstrap = (ruleSchema.debugBootstrap && typeof ruleSchema.debugBootstrap === "object")
        ? ruleSchema.debugBootstrap
        : null;
      kwsBridge.pushLogLine(
        `TRACE schema rules:${rules.length} signals:${signals.length} wake_main:${hasWakeMain} tele_home:${hasTeleHome}`,
        "muted"
      );
      if (debugBootstrap) {
        kwsBridge.pushLogLine(
          `TRACE bootstrap stage:${String(debugBootstrap.stage || "na")} build:${Number(debugBootstrap.buildRules) || 0}/${Number(debugBootstrap.buildSignals) || 0} validate:${Number(debugBootstrap.postValidateRules) || 0}/${Number(debugBootstrap.postValidateSignals) || 0} integrity:${Number(debugBootstrap.postIntegrityRules) || 0}/${Number(debugBootstrap.postIntegritySignals) || 0} fallback:${debugBootstrap.adapterFallbackUsed ? "true" : "false"} errs:${Number(debugBootstrap.validateErrorCount) || 0}/${Number(debugBootstrap.integrityErrorCount) || 0}`,
          "muted"
        );
      }
      if (orbisSignal) {
        kwsBridge.pushLogLine(
          `TRACE sig.orbis src:${String(orbisSignal.sourceEvent || "")} path:${String(orbisSignal.where && orbisSignal.where.path || "")} eq:${String(orbisSignal.where && orbisSignal.where.eq || "")}`,
          "muted"
        );
      }
    }
  }

  const globeSpawns = (Array.isArray(worldItemSpawns) ? worldItemSpawns : [])
    .map(normalizeWorldItemSpawn)
    .filter(Boolean);
  const fallbackSpawn = {
    id: "globe_mid_01",
    xNorm: 0.5,
    yW: groundCenterWorld() - 1000,
    r: 25,
  };
  const resolvedGlobeSpawns = globeSpawns.length ? globeSpawns : [fallbackSpawn];

  const worldSystem = createWorldSystem({
    eventBus,
    stageEl: els.physStage,
    getStageRect: () => stageRect(),
    worldToScreenY: (yW) => pickupScreenY(yW),
    getOrbWorldPosition: () => ({ xNorm: 0.5, yW: getOrbRuntime().yW }),
    orbRadiusPx: PHYS.orbRadiusPx,
    spawns: resolvedGlobeSpawns,
    spawn: {
      xNorm: 0.5,
      yW: groundCenterWorld() - 1000,
      r: 25,
    },
    getGlobeEl: () => els.testGlobe,
    setGlobeEl: (el) => { els.testGlobe = el; },
  });

  const orbSystemsBundle = createOrbSystemsBundle({
    createOrbSystem,
    createOrbFxSystem,
    gameState,
    eventBus,
    orbFxOptions: {
      orbInteriorEl: els.orbInterior,
      stageEl: els.physStage,
      getOrbScreenY,
      orbRadiusPx: PHYS.orbRadiusPx,
      getAxisColor01: (axis) => axisToColor01(axis),
    },
  });
  const orbSystem = orbSystemsBundle && orbSystemsBundle.orbSystem;
  const orbFxSystem = orbSystemsBundle && orbSystemsBundle.orbFxSystem;

  orbDamageVisualsRuntime.start();
  audioSystem.start();
  inputSystemsBundle.start();
  resourcesSystem.start();
  spellDispatchSystem.start();
  if (ruleEnginePreviewSystem && typeof ruleEnginePreviewSystem.start === "function") {
    ruleEnginePreviewSystem.start();
    if (RULE_CHAIN_TRACE_ENABLED && kwsBridge && typeof kwsBridge.pushLogLine === "function") {
      kwsBridge.pushLogLine("TRACE rule_engine:start", "muted");
    }
  }
  if (orbSystemsBundle && typeof orbSystemsBundle.start === "function") {
    orbSystemsBundle.start();
  }

  return {
    eventBus,
    gameState,
    orbDamageVisualsRuntime,
    audioSystem,
    inputSystemsBundle,
    inputSystem,
    inputDynamicsSystem,
    inputGestureSystem,
    resourcesSystem,
    spellDispatchSystem,
    ruleEnginePreviewSystem,
    worldSystem,
    orbSystemsBundle,
    orbSystem,
    orbFxSystem,
  };
}
