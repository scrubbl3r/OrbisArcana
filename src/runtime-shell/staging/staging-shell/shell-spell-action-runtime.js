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
      void payload;
      const orbRuntimeState = runtime && runtime.orbRuntimeState;
      if (!orbRuntimeState || typeof orbRuntimeState.get !== "function" || typeof orbRuntimeState.patch !== "function") {
        return false;
      }
      const state = orbRuntimeState.get();
      if (!state) return false;
      if (state.floatHoldActive) {
        orbRuntimeState.patch({
          floatHoldActive: false,
          floatGraceActive: false,
          floatGraceUntilMs: 0,
        });
        return true;
      }
      const xW = Number.isFinite(Number(state.xW)) ? Number(state.xW) : 0;
      const yW = Number.isFinite(Number(state.yW)) ? Number(state.yW) : 0;
      orbRuntimeState.patch({
        floatHoldActive: true,
        floatHoldAnchorX: xW,
        floatHoldAnchorY: yW,
        floatGraceActive: false,
        floatGraceUntilMs: 0,
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
      return true;
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
