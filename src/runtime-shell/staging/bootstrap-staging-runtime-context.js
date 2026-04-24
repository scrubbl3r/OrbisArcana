import { getOrbCastGateState as getSharedOrbCastGateState } from "../../game-runtime/orb/orb-cast-policy.js";
import { ORB_LIFECYCLE_DEFAULTS } from "../../game-runtime/orb/orb-lifecycle-default.js?v=20260418b";
import { buildWorldGlobeVisualState } from "../../game-runtime/world/world-globe-state.js?v=20260418a";

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
  getOrbScreenX = () => 0,
  getOrbScreenY = () => 0,
  getOrbVisualRadiusPx = null,
  axisToColor01 = () => 0,
  gestureHooks = {},
} = {}) {
  const eventBus = createEventBus();
  const gameState = createGameState({
    orb: {
      maxHealth: 300,
      health: 300,
      maxHits: Math.max(1, Math.round(Number(ORB_LIFECYCLE_DEFAULTS.maxHits) || 3)),
      collisionDamage: 100,
      collisionThreshold: IMPACT_TH,
      collisionCooldownMs: 250,
    },
  });
  const getOrbCastGateState = () => getSharedOrbCastGateState(gameState && gameState.orb ? gameState.orb : null);
  const getOrbFxRadiusPx = () => {
    const visualRadiusPx = (typeof getOrbVisualRadiusPx === "function") ? Number(getOrbVisualRadiusPx()) : NaN;
    if (Number.isFinite(visualRadiusPx) && visualRadiusPx > 0) return visualRadiusPx;
    return Number(PHYS.orbRadiusPx) || 0;
  };

  const orbDamageVisualsRuntime = createOrbDamageVisualsRuntime({
    eventBus,
    getOrbRadiusPx: getOrbFxRadiusPx,
  });
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
    getOrbCastGateState,
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
    id: "globe_emitter_01",
    kind: "energy_globe_emitter",
    xNorm: 0.5,
    yW: groundCenterWorld() - 1000,
    r: 25,
    capacity: 1,
    regenTrigger: "globe_spent",
  };
  const resolvedGlobeSpawns = globeSpawns.length ? globeSpawns : [fallbackSpawn];

  const worldSystem = createWorldSystem({
    eventBus,
    stageEl: els.physStage,
    getStageEl: () => els.physStage,
    getStageRect: () => stageRect(),
    worldToScreenX: (xW) => {
      const orb = getOrbRuntime();
      const rect = stageRect();
      const orbScreenX = Number(getOrbScreenX());
      const orbWorldX = Number(orb && orb.xW);
      if (Number.isFinite(orbScreenX) && Number.isFinite(orbWorldX)) {
        return orbScreenX + (Number(xW || 0) - orbWorldX);
      }
      return Number(xW || 0);
    },
    worldToScreenY: (yW) => pickupScreenY(yW),
    getOrbWorldPosition: () => {
      const rect = stageRect();
      const stageWidth = Math.max(1, Number(rect && rect.width) || 1);
      const orbScreenX = Number(getOrbScreenX());
      const xNorm = Number.isFinite(orbScreenX)
        ? Math.max(0, Math.min(1, orbScreenX / stageWidth))
        : 0.5;
      return { xNorm, xW: getOrbRuntime().xW, yW: getOrbRuntime().yW };
    },
    getOrbScreenX,
    getOrbScreenY,
    orbRadiusPx: getOrbFxRadiusPx(),
    getOrbRadiusPx: getOrbFxRadiusPx,
    spawns: resolvedGlobeSpawns,
    spawn: {
      xNorm: 0.5,
      yW: groundCenterWorld() - 1000,
      r: 25,
    },
    getGlobeEl: () => els.testGlobe,
    setGlobeEl: (el) => { els.testGlobe = el; },
    worldGlobeVisualState: buildWorldGlobeVisualState(null, {
      orbDiameterPx: getOrbFxRadiusPx() * 2,
    }),
  });
  const orbFxWorldGlobeVisualState = buildWorldGlobeVisualState(null, {
    orbDiameterPx: getOrbFxRadiusPx() * 2,
  });

  const orbSystemsBundle = createOrbSystemsBundle({
    createOrbSystem,
    createOrbFxSystem,
    gameState,
    eventBus,
    orbFxOptions: {
      orbInteriorEl: els.orbInterior,
      getOrbInteriorEl: () => els.orbInterior,
      stageEl: els.physStage,
      getStageEl: () => els.physStage,
      getOrbScreenX,
      getOrbScreenY,
      orbRadiusPx: getOrbFxRadiusPx(),
      getOrbRadiusPx: getOrbFxRadiusPx,
      getAxisColor01: (axis) => axisToColor01(axis),
      worldGlobeVisualState: orbFxWorldGlobeVisualState,
    },
  });
  const orbSystem = orbSystemsBundle && orbSystemsBundle.orbSystem;
  const orbFxSystem = orbSystemsBundle && orbSystemsBundle.orbFxSystem;

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
