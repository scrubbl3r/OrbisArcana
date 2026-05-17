import { getOrbCastGateState as getSharedOrbCastGateState } from "../../../game-runtime/orb/orb-cast-policy.js";
import { resolveOrbGraceDefaultTtlMs } from "../../../game-runtime/orb/orb-grace.js";

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

  const shellSpellActionHandlers = createSpellActionHandlersImported({
    eventBus,
    playElectricAoe: () => (
      getRuntimeVfx() && typeof getRuntimeVfx().playElectricAoe === "function"
        ? getRuntimeVfx().playElectricAoe()
        : { handled: false }
    ),
    playFlameAoe: (payload = {}) => (
      typeof shellActions.playFlameAoe === "function"
        ? shellActions.playFlameAoe(payload)
        : { handled: false }
    ),
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
      if (state.floatGraceActive && state.floatGracePersistent && String(state.floatGraceSource || "") === "float") {
        orbRuntimeState.patch({
          floatGraceActive: false,
          floatGraceUntilMs: 0,
          floatGracePersistent: false,
          floatGraceSource: "",
          floatGraceSuppressInput: false,
          floatGraceBreakOnLift: true,
          floatGraceBreakOnMotion: true,
        });
        if (typeof shellActions.setOrbFloatHoldVisual === "function") {
          shellActions.setOrbFloatHoldVisual({ active: false, atMs: Number(payload && payload.atMs) || performance.now() });
        }
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
      orbRuntimeState.patch({
        yW: anchorY,
        floatGraceActive: true,
        floatGraceUntilMs: 0,
        floatGracePersistent: true,
        floatGraceSource: "float",
        floatGraceSuppressInput: true,
        floatGraceBreakOnLift: false,
        floatGraceBreakOnMotion: false,
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
          active: false,
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
        source: "modulon",
      });
    },
    playFrostAoe: null,
    executeAoeElectric: executors.executeAoeElectric,
    executeAoeFlame: executors.executeAoeFlame,
    executeAoeFrost: null,
    executeTeleport: executors.executeTeleport,
    executeShockwave: executors.executeShockwave,
    executeBubbleShield: executors.executeBubbleShield,
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
