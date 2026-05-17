import {
  COMBAT_ENTITY_ORB,
  DAMAGE_TYPE_LEECH,
} from "../../game-runtime/combat/combat-constants.js";
import { normalizeImmunityEffect } from "../../game-runtime/combat/immunity-model.js";
import {
  EVT_COMBAT_DAMAGE_BLOCKED,
  EVT_COMBAT_DAMAGE_REQUESTED,
  EVT_COMBAT_IMMUNITY_CHANGED,
  EVT_COMBAT_MOTION_MODIFIER_CHANGED,
  EVT_ORB_DAMAGE_BLOCKED,
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
    combatImmunity: null,
    isCombatImmune(targetEntityId = COMBAT_ENTITY_ORB, atMs = performance.now()) {
      const immunity = this.combatImmunity;
      return !!(
        immunity &&
        immunity.immune &&
        String(immunity.targetEntityId || "") === String(targetEntityId || "") &&
        Number(immunity.untilMs || 0) > Number(atMs || 0)
      );
    },
    lastImpact: null,
    applyImpact(impact, source, meta = {}) {
      const atMs = performance.now();
      this.lastImpact = {
        impact: Number(impact) || 0,
        source: source || "unknown",
        rawImpact: Number(meta.rawImpact) || 0,
        gravityMul: Number(meta.gravityMul) || 0,
        fallDrag: Number(meta.fallDrag) || 0,
        atMs,
      };
      if (this.isCombatImmune(COMBAT_ENTITY_ORB, atMs)) {
        const payload = {
          reason: "combat_immunity",
          immunityId: String(this.combatImmunity && this.combatImmunity.immunityId || ""),
          impact: Number(impact) || 0,
          source: source || "unknown",
          atMs,
        };
        if (eventBus && typeof eventBus.emit === "function") {
          eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, payload);
          eventBus.emit(EVT_COMBAT_DAMAGE_BLOCKED, {
            ...payload,
            targetEntityId: COMBAT_ENTITY_ORB,
            sourceEntityId: source || "unknown",
          });
        }
        updateDebugReadout();
        return { applied: false, reason: "combat_immunity" };
      }
      orbSystem.applyImpact({
        impact,
        source,
        atMs,
        rawImpact: meta.rawImpact,
        gravityMul: meta.gravityMul,
        fallDrag: meta.fallDrag,
      });
      updateDebugReadout();
      return { applied: true };
    },
  };

  if (eventBus && typeof eventBus.on === "function") {
    eventBus.on(EVT_COMBAT_DAMAGE_REQUESTED, (payload = {}) => {
      const meta = payload && payload.meta || {};
      if (String(payload && payload.targetEntityId || "") !== COMBAT_ENTITY_ORB) return;
      if (String(meta.sourceSystem || "") !== "gnat-swarm-feeding") return;
      if (meta.routedToOrbSystem) return;
      if (!orbSystem || typeof orbSystem.applyDamage !== "function") return;
      const atMs = Number(payload.atMs) || performance.now();
      if (receiverRuntime.isCombatImmune(COMBAT_ENTITY_ORB, atMs)) {
        eventBus.emit(EVT_ORB_DAMAGE_BLOCKED, {
          reason: "combat_immunity",
          immunityId: String(receiverRuntime.combatImmunity && receiverRuntime.combatImmunity.immunityId || ""),
          amount: Number(payload.amount) || 0,
          source: String(payload.sourceEntityId || payload.source || "unknown"),
          atMs,
        });
        eventBus.emit(EVT_COMBAT_DAMAGE_BLOCKED, {
          ...payload,
          reason: "combat_immunity",
          immunityId: String(receiverRuntime.combatImmunity && receiverRuntime.combatImmunity.immunityId || ""),
          atMs,
        });
        updateDebugReadout();
        return;
      }
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
      if (receiverRuntime.isCombatImmune(COMBAT_ENTITY_ORB, atMs)) {
        receiverRuntime.combatLiftPenalty = 0;
        receiverRuntime.combatLiftPenaltyUntilMs = 0;
        return;
      }
      receiverRuntime.combatLiftPenalty = Math.max(0, Number(payload.liftPenalty) || 0);
      receiverRuntime.combatLiftPenaltyUntilMs = atMs + Math.max(0, Number(payload.durationMs) || 0);
    });
    eventBus.on(EVT_COMBAT_IMMUNITY_CHANGED, (payload = {}) => {
      const immunity = normalizeImmunityEffect(payload);
      if (String(immunity.targetEntityId || "") !== COMBAT_ENTITY_ORB) return;
      receiverRuntime.combatImmunity = immunity.immune ? immunity : null;
      if (immunity.immune) {
        receiverRuntime.combatLiftPenalty = 0;
        receiverRuntime.combatLiftPenaltyUntilMs = 0;
      }
      updateDebugReadout();
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
