import {
  COMBAT_ENTITY_ORB,
  DAMAGE_TYPE_LEECH,
} from "../../game-runtime/combat/combat-constants.js";
import {
  EVT_COMBAT_DAMAGE_REQUESTED,
  EVT_COMBAT_MOTION_MODIFIER_CHANGED,
} from "../../contracts/events.js";

export function bootstrapStagingRuntimeBundle({
  eventBus,
  gameState,
  orbSystem,
  orbDamageVisualsRuntime,
  audioSystem,
  inputSystemsBundle,
  inputSystem,
  inputDynamicsSystem,
  inputGestureSystem,
  orbRuntimeState,
  ruleSchema = null,
  ruleEnginePreviewSystem = null,
  RULE_ENGINE_EXECUTE_ACTIONS = false,
  resourcesSystem = null,
  orbRuntimeLoop = null,
  spellDispatchSystem = null,
  kwsWordProvider = null,
  voiceProviderManager = null,
  kwsVoiceProvider = null,
  kwsRuntimeCommands = {},
  kwsBootOrchestrator = null,
  grantOrbGrace = () => {},
  worldSystem = null,
  clearDeathOverlaySchedule = () => {},
  closeDeathOverlay = () => {},
  updateDebugReadout = () => {},
  setOrbInputSuppressed = () => {},
} = {}) {
  const ruleEngineRuntimeState = {
    ruleSchema,
    ruleEnginePreviewSystem,
    ruleEngineExecuteActions: RULE_ENGINE_EXECUTE_ACTIONS,
  };

  const receiverRuntime = {
    eventBus,
    gameState,
    orbSystem,
    orbDamageVisualsRuntime,
    audioSystem,
    inputSystemsBundle,
    inputSystem,
    inputDynamicsSystem,
    inputGestureSystem,
    orbRuntimeState,
    ...ruleEngineRuntimeState,
    resourcesSystem,
    orbRuntimeLoop,
    spellDispatchSystem,
    kwsWordProvider,
    voiceProviderManager,
    kwsVoiceProvider,
    ...kwsRuntimeCommands,
    grantOrbGrace,
    combatLiftPenalty: 0,
    combatLiftPenaltyUntilMs: 0,
    lastImpact: null,
    applyImpact(impact, source, meta = {}) {
      this.lastImpact = {
        impact: Number(impact) || 0,
        source: source || "unknown",
        rawImpact: Number(meta.rawImpact) || 0,
        gravityMul: Number(meta.gravityMul) || 0,
        fallDrag: Number(meta.fallDrag) || 0,
        atMs: performance.now(),
      };
      orbSystem.applyImpact({ impact, source, atMs: performance.now() });
      updateDebugReadout();
    },
  };

  if (eventBus && typeof eventBus.on === "function") {
    eventBus.on(EVT_COMBAT_DAMAGE_REQUESTED, (payload = {}) => {
      const meta = payload && payload.meta || {};
      if (String(payload && payload.targetEntityId || "") !== COMBAT_ENTITY_ORB) return;
      if (String(meta.sourceSystem || "") !== "gnat-swarm-feeding") return;
      if (meta.routedToOrbSystem) return;
      if (!orbSystem || typeof orbSystem.applyDamage !== "function") return;
      orbSystem.applyDamage({
        ...payload,
        damageType: payload.damageType || DAMAGE_TYPE_LEECH,
        cause: payload.cause || DAMAGE_TYPE_LEECH,
        meta: {
          ...meta,
          routedToOrbSystem: true,
        },
      });
      updateDebugReadout();
    });
    eventBus.on(EVT_COMBAT_MOTION_MODIFIER_CHANGED, (payload = {}) => {
      if (String(payload && payload.modifierId || "") !== "gnat-swarm:feeding") return;
      if (String(payload && payload.targetEntityId || "") !== COMBAT_ENTITY_ORB) return;
      const atMs = Number(payload.atMs) || performance.now();
      receiverRuntime.combatLiftPenalty = Math.max(0, Number(payload.liftPenalty) || 0);
      receiverRuntime.combatLiftPenaltyUntilMs = atMs + Math.max(0, Number(payload.durationMs) || 0);
    });
  }

  if (receiverRuntime && kwsBootOrchestrator && typeof kwsBootOrchestrator.bootAndAutostart === "function") {
    kwsBootOrchestrator.bootAndAutostart(receiverRuntime);
  }
  if (receiverRuntime && receiverRuntime.orbSystem && typeof receiverRuntime.orbSystem.revive === "function") {
    receiverRuntime.orbSystem.revive({ health: 1000, atMs: performance.now() });
  }
  receiverRuntime.lastImpact = null;
  setOrbInputSuppressed(false);
  if (worldSystem && typeof worldSystem.reset === "function") worldSystem.reset(performance.now());
  clearDeathOverlaySchedule();
  closeDeathOverlay();
  updateDebugReadout();

  return receiverRuntime;
}
