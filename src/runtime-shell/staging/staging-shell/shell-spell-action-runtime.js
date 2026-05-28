import { getOrbCastGateState as getSharedOrbCastGateState } from "../../../game-runtime/orb/orb-cast-policy.js";
import { resolveOrbGraceDefaultTtlMs, resolveOrbGracePayload } from "../../../game-runtime/orb/orb-grace.js";
import { EVT_VOICE_SPELL_REJECTED } from "../../../contracts/events.js";
import { HEAL_PRESET_DEFAULT } from "../../../vfx/presets/heal-default.js?v=20260517b";

export const FLOAT_GRACE_PROFILE = Object.freeze({
  source: "float",
  clearPolicy: "source_toggle_only",
  lockSource: "graviton",
  persistent: true,
  suppressInput: true,
  breakOnLift: false,
  breakOnMotion: false,
});

export function createShellSpellActionRuntime({
  runtime = null,
  eventBus = null,
  createSpellActionHandlersImported = null,
  createSpellCastExecutor = null,
  castActionRegistryById = null,
  receiverSpellRuntime = {},
  executors = {},
  getRuntimeVfx = () => null,
  shellActions = {},
} = {}) {
  if (
    !runtime ||
    typeof createSpellActionHandlersImported !== "function" ||
    typeof createSpellCastExecutor !== "function"
  ) {
    return null;
  }

  let lastHealCastAtMs = 0;

  function clearFloatGraceState(orbRuntimeState, payload = {}) {
    if (!orbRuntimeState || typeof orbRuntimeState.patch !== "function") return;
    orbRuntimeState.patch({
      floatGraceActive: false,
      floatGraceUntilMs: 0,
      floatGracePersistent: false,
      floatGraceSource: "",
      floatGraceClearPolicy: "",
      floatGraceLockSource: "",
      floatGraceSuppressInput: false,
      floatGraceBreakOnLift: true,
      floatGraceBreakOnMotion: true,
      floatGraceStartedAtMs: 0,
      floatGraceMinBreakMs: 0,
    });
    if (typeof shellActions.setOrbFloatHoldVisual === "function") {
      shellActions.setOrbFloatHoldVisual({ active: false, atMs: Number(payload && payload.atMs) || performance.now() });
    }
  }

  const shellSpellActionHandlers = createSpellActionHandlersImported({
    eventBus,
    playTesla1: (payload = {}) => (
      getRuntimeVfx() && typeof getRuntimeVfx().playTesla1 === "function"
        ? getRuntimeVfx().playTesla1(payload)
        : getRuntimeVfx() && typeof getRuntimeVfx().playElectricAoe === "function"
          ? getRuntimeVfx().playElectricAoe({ ...(payload && typeof payload === "object" ? payload : {}), effect: "tesla-1" })
          : { handled: false }
    ),
    playElectricAoe: (payload = {}) => (
      getRuntimeVfx() && typeof getRuntimeVfx().playTesla1 === "function"
        ? getRuntimeVfx().playTesla1({ ...(payload && typeof payload === "object" ? payload : {}), effect: "tesla-1" })
        : getRuntimeVfx() && typeof getRuntimeVfx().playElectricAoe === "function"
          ? getRuntimeVfx().playElectricAoe({ ...(payload && typeof payload === "object" ? payload : {}), effect: "tesla-1" })
        : { handled: false }
    ),
    playFlameAoe: (payload = {}) => {
      const runtimeVfx = getRuntimeVfx();
      const perfTrace = runtime && runtime.perfTrace ? runtime.perfTrace : null;
      if (perfTrace && typeof perfTrace.mark === "function") {
        perfTrace.mark("flameAoe.spellHandler.called", {
          hasRuntimeVfx: !!runtimeVfx,
          hasPlayFlameAoe: !!(runtimeVfx && typeof runtimeVfx.playFlameAoe === "function"),
        });
      }
      return runtimeVfx && typeof runtimeVfx.playFlameAoe === "function"
        ? runtimeVfx.playFlameAoe(payload)
        : { handled: false };
    },
    playTeleport: (payload = {}) => (
      getRuntimeVfx() && typeof getRuntimeVfx().playTeleport === "function"
        ? getRuntimeVfx().playTeleport(payload)
        : { handled: false }
    ),
    toggleFloat: (payload = {}) => {
      const orbRuntimeState = runtime && runtime.orbRuntimeState;
      if (!orbRuntimeState || typeof orbRuntimeState.get !== "function" || typeof orbRuntimeState.patch !== "function") {
        return false;
      }
      const state = orbRuntimeState.get();
      if (!state) return false;
      const lockSource = String(state.floatGraceLockSource || "");
      const clearPolicy = String(state.floatGraceClearPolicy || "");
      const sourceWordId = String(
        (payload && (payload.sourceWordId || payload.wordId || payload.spellId)) ||
        (lockSource || "graviton")
      ).trim().toLowerCase();
      if (
        state.floatGraceActive &&
        state.floatGracePersistent &&
        String(state.floatGraceSource || "") === "float" &&
        (!clearPolicy || clearPolicy !== "source_toggle_only" || !lockSource || sourceWordId === lockSource)
      ) {
        clearFloatGraceState(orbRuntimeState, payload);
        return true;
      }
      if (
        state.floatGraceActive &&
        state.floatGracePersistent &&
        String(state.floatGraceSource || "") === "float" &&
        clearPolicy === "source_toggle_only" &&
        lockSource &&
        sourceWordId !== lockSource
      ) {
        return true;
      }
      const yW = Number.isFinite(Number(state.yW)) ? Number(state.yW) : 0;
      const stage = runtime && runtime.stage ? runtime.stage : null;
      const phys = stage && stage.phys ? stage.phys : {};
      const yFloor = typeof shellActions.groundCenterWorld === "function"
        ? Number(shellActions.groundCenterWorld())
        : yW;
      const yCeil = typeof shellActions.ceilingWorld === "function"
        ? Number(shellActions.ceilingWorld())
        : (Number(phys.orbRadiusPx) || yW);
      const radius = Number(phys.orbRadiusPx) || 50;
      const hasFloor = Number.isFinite(yFloor);
      const hoverRoomY = hasFloor ? Math.max(yCeil, yFloor - Math.max(6, radius * 0.16)) : yW;
      const anchorY = hasFloor && yW >= (yFloor - Math.max(4, radius * 0.12))
        ? hoverRoomY
        : yW;
      const phase = Math.random() * Math.PI * 2;
      const floatGrace = resolveOrbGracePayload(FLOAT_GRACE_PROFILE);
      orbRuntimeState.patch({
        yW: anchorY,
        floatGraceActive: true,
        floatGraceUntilMs: Number(floatGrace && floatGrace.ttlMs) || 0,
        floatGracePersistent: !!(floatGrace && floatGrace.persistent),
        floatGraceSource: String(floatGrace && floatGrace.source || ""),
        floatGraceClearPolicy: String(floatGrace && floatGrace.clearPolicy || ""),
        floatGraceLockSource: String(floatGrace && floatGrace.lockSource || ""),
        floatGraceSuppressInput: !!(floatGrace && floatGrace.suppressInput),
        floatGraceBreakOnLift: floatGrace ? floatGrace.breakOnLift !== false : true,
        floatGraceBreakOnMotion: floatGrace ? floatGrace.breakOnMotion !== false : true,
        floatGraceStartedAtMs: Number(payload && payload.atMs) || performance.now(),
        floatGraceMinBreakMs: Math.max(0, Number(floatGrace && floatGrace.minBreakMs) || 0),
        floatGraceAnchorY: anchorY,
        floatGracePhase: phase,
        teleportHoldActive: false,
        spawnHoldActive: false,
        v: 0,
        vx: 0,
        lift01: 0,
        steerIntentX: 0,
        steerActive: false,
        onGround: false,
        descendMs: 0,
        shieldDescentBlocked: false,
      });
      if (typeof shellActions.setOrbFloatHoldVisual === "function") {
        shellActions.setOrbFloatHoldVisual({
          active: true,
          atMs: Number(payload && payload.atMs) || performance.now(),
          phase,
        });
      }
      return true;
    },
    enableOrbSpin: (payload = {}) => {
      const receiverRuntime = typeof shellActions.resolveReceiverRuntime === "function"
        ? shellActions.resolveReceiverRuntime(runtime)
        : null;
      const inputGestureSystem = receiverRuntime && receiverRuntime.inputGestureSystem;
      if (!inputGestureSystem || typeof inputGestureSystem.enableFlatSpinAbilityWindow !== "function") {
        return false;
      }
      const durationMs = Number(payload && payload.durationMs);
      const transitionMs = Number(payload && payload.transitionMs);
      return inputGestureSystem.enableFlatSpinAbilityWindow({
        atMs: Number(payload && payload.atMs) || performance.now(),
        durationMs: Number.isFinite(durationMs) ? durationMs : 1500,
        transitionMs: Number.isFinite(transitionMs) ? transitionMs : 0,
        source: "modula",
      });
    },
    playFrostAoe: null,
    executeTesla1: executors.executeTesla1,
    executeAoeFlame: executors.executeAoeFlame,
    executeAoeFrost: null,
    executeTeleport: executors.executeTeleport,
    executeShockwave: executors.executeShockwave,
    executeBubbleShield: executors.executeBubbleShield,
    executeHeal: (payload = {}) => {
      const receiverRuntime = typeof shellActions.resolveReceiverRuntime === "function"
        ? shellActions.resolveReceiverRuntime(runtime)
        : null;
      const orbSystem = receiverRuntime && receiverRuntime.orbSystem;
      const resourcesSystem = receiverRuntime && receiverRuntime.resourcesSystem;
      const gameStateOrb = receiverRuntime && receiverRuntime.gameState ? receiverRuntime.gameState.orb : null;
      const preset = HEAL_PRESET_DEFAULT;
      const atMs = Number(payload && payload.atMs) || performance.now();
      const globeCost = Math.max(0, Math.round(Number(preset.globeCost) || 0));
      const healAmountHp = Math.max(1, Math.round(Number(preset.healAmountHp) || 1));
      const cooldownMs = Math.max(0, Math.round(Number(preset.cooldownMs) || 0));
      const castDurationMs = Math.max(0, Math.round(Number(preset.castDurationMs) || 0));
      const lockoutMs = Math.max(cooldownMs, castDurationMs);
      const wordId = String(payload && (payload.wordId || payload.sourceWordId || payload.spellId) || "salubrium");

      function reject(reason, extra = {}) {
        if (eventBus && typeof eventBus.emit === "function") {
          eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
            reason,
            wordId,
            spellId: "heal",
            castActionId: "heal",
            atMs,
            ...extra,
          });
        }
        return false;
      }

      if (!orbSystem || typeof orbSystem.applyHeal !== "function") {
        return reject("heal_unavailable");
      }
      const maxHealth = Math.max(1, Number(gameStateOrb && (gameStateOrb.maxHealth ?? gameStateOrb.max)) || 1000);
      const health = Math.max(0, Math.min(maxHealth, Number(gameStateOrb && gameStateOrb.health) || 0));
      const alive = gameStateOrb ? gameStateOrb.alive !== false : true;
      if (!alive) return reject("orb_dead");
      if (preset.requireDamagedOrb !== false && health >= maxHealth) {
        return reject("orb_full");
      }
      if (lockoutMs > 0 && lastHealCastAtMs > 0 && atMs - lastHealCastAtMs < lockoutMs) {
        return reject("cooldown", {
          cooldownMs: lockoutMs,
          remainingMs: Math.max(0, Math.ceil(lockoutMs - (atMs - lastHealCastAtMs))),
        });
      }
      if (globeCost > 0) {
        if (!resourcesSystem || typeof resourcesSystem.getStoredGlobeCount !== "function" || typeof resourcesSystem.consumeStoredGlobe !== "function") {
          return reject("resources_unavailable", { requiredGlobes: globeCost, storedGlobes: 0 });
        }
        const stored = Math.max(0, Number(resourcesSystem.getStoredGlobeCount()) || 0);
        if (stored < globeCost) {
          return reject("insufficient_globes", { requiredGlobes: globeCost, storedGlobes: stored });
        }
        for (let i = 0; i < globeCost; i += 1) {
          const spendResult = resourcesSystem.consumeStoredGlobe({
            ...payload,
            reason: "heal_cast",
            wordId,
            spellId: "heal",
            atMs,
          });
          if (!spendResult || spendResult.ok !== true) {
            return reject("insufficient_globes", {
              requiredGlobes: globeCost,
              storedGlobes: Math.max(0, Number(spendResult && spendResult.stored) || 0),
            });
          }
        }
      }
      const healResult = orbSystem.applyHeal({
        amount: healAmountHp,
        source: "salubrium",
        sourceEntityId: "spell.heal",
        atMs,
      });
      if (healResult && healResult.applied) {
        lastHealCastAtMs = atMs;
        return true;
      }
      return preset.consumeOnFailedCast === true;
    },
    executeColorize: executors.executeColorize,
    triggerShockwave: () => (
      getRuntimeVfx() && typeof getRuntimeVfx().triggerShockwave === "function"
        ? getRuntimeVfx().triggerShockwave()
        : { handled: false }
    ),
    teleportOrbToSpawnNeutralizePhysics: (aboveGroundPx) => (
      typeof shellActions.teleportOrbToSpawnNeutralizePhysics === "function"
        ? shellActions.teleportOrbToSpawnNeutralizePhysics(aboveGroundPx)
        : { handled: false }
    ),
    activateBubbleShield: ({ durationMs } = {}) => {
      if (typeof shellActions.activateBubbleShield === "function") {
        shellActions.activateBubbleShield({ durationMs });
      }
    },
    applyColorize: (payload) => {
      if (typeof shellActions.applyColorize === "function") shellActions.applyColorize(payload);
    },
    clearColorize: () => {
      if (typeof shellActions.clearColorize === "function") shellActions.clearColorize();
    },
    domusTeleportAboveGroundPx: 0,
    bubbleShieldMs: 8000,
  });

  const shellSpellCastExecutor = createSpellCastExecutor({
    castActionRegistryById,
    handlers: shellSpellActionHandlers,
    grantOrbGrace: (grace) => {
      if (typeof shellActions.grantOrbGrace === "function") shellActions.grantOrbGrace(grace);
    },
    getCastGateState: () => {
      const receiverRuntime = typeof shellActions.resolveReceiverRuntime === "function"
        ? shellActions.resolveReceiverRuntime(runtime)
        : null;
      const orb = receiverRuntime && receiverRuntime.gameState ? receiverRuntime.gameState.orb : null;
      return getSharedOrbCastGateState(orb);
    },
    defaultGraceTtlMs: resolveOrbGraceDefaultTtlMs(
      runtime && runtime.stage ? runtime.stage.statusConfig : null,
      2500
    ),
  });

  return {
    receiverSpellRuntime: {
      teleportOrbRuntimeToSpawn: (typeof receiverSpellRuntime.teleportOrbRuntimeToSpawn === "function")
        ? receiverSpellRuntime.teleportOrbRuntimeToSpawn
        : null,
      grantOrbGraceRuntime: (typeof receiverSpellRuntime.grantOrbGraceRuntime === "function")
        ? receiverSpellRuntime.grantOrbGraceRuntime
        : null,
    },
    shellSpellActionHandlers,
    shellSpellCastExecutor,
  };
}
