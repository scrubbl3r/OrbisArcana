import { dispatchRuntimeEffect } from "../../../vfx/dispatch-runtime-effect.js?v=20260506a";
import { TELEPORT_BEHAVIOR_DEFAULT } from "../../../game-runtime/behaviors/teleport-behavior-default.js?v=20260501a";
import { buildTeleportBehaviorConfig } from "../../../game-runtime/behaviors/teleport-behavior-state.js?v=20260501a";
import { createTeleportSequenceRuntime } from "../../../game-runtime/behaviors/teleport-sequence-runtime.js?v=20260501d";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../../../vfx/presets/bubble-shield-3d-default.js?v=20260506d";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../../../vfx/presets/flame-aoe-3d-default.js?v=20260528153907";
import { TESLA_1_PRESET_DEFAULT } from "../../../vfx/presets/tesla-1-default.js?v=20260527122742";
import { SHOCKWAVE_3D_PRESET_DEFAULT } from "../../../vfx/presets/shockwave-3d-default.js?v=20260506a";

export function createOrbStageReceiverVfxDefaults({ evenStroke = (value) => value } = {}) {
  const defaults = {
    shield: {
      colorRgb: { r: 120, g: 210, b: 255 },
      diameterRatio: 1.24,
      strokeWidthRatio: 0.04,
      durationMs: 8000,
      alpha: 1.0,
      pulseMs: 80,
      pulseMin: 0.3,
      pulseMax: 1.0,
    },
    shield3d: { ...BUBBLE_SHIELD_3D_PRESET_DEFAULT },
    shock: {
      color: { r: 255, g: 255, b: 255, a: 0.65 },
      startRatio: 0.43,
      endRatio: 1.69,
      rings: 2,
      spawnMs: 105,
      strokeRatio: 0.04,
      decayMs: 150,
    },
    shock3d: { ...SHOCKWAVE_3D_PRESET_DEFAULT },
    flame: {
      diameterRatio: 2.0,
      durationMs: 10000,
    },
    flame3d: { ...FLAME_AOE_3D_PRESET_DEFAULT },
    tesla1: { ...TESLA_1_PRESET_DEFAULT },
    electric: {
      startRatio: 0.80,
      endRatio: 2.0,
      durationMs: 10000,
      nodeCount: 13,
      particleCount: 340,
      particleSpeed: 0.62,
      maxBoltJumpSq: 1200,
      startJitterRatio: 0.3,
    },
    nod: {
      orbTemplateShrinkPct: 6,
      orbTemplateDurationMs: 500,
      orbTemplateFillAlpha: 0.28,
      orbTemplateWaveCount: 10,
      orbTemplateWaveDepthPx: 4,
      orbTemplateOscillationSpeedHz: 12,
      orbTemplateOscillationCount: 4,
    },
    nod3d: {
      orbNod3dShrinkPct: 2,
      orbNod3dDurationMs: 520,
      orbNod3dFillAlpha: 0.07,
      orbNod3dWaveCount: 4,
      orbNod3dLatitudinalBands: 4,
      orbNod3dWaveDepthBO: 0.024,
      orbNod3dOscillationSpeedHz: 4.8,
      orbNod3dOscillationCount: 2,
      orbNod3dEquatorFalloff: 0,
      orbNod3dRippleSoftness: 0.82,
    },
    orbSpawn: {
      bobRangeBO: 0.65,
      bobSpeedHz: 0.65,
      driftRangeBO: 0.2,
      driftSpeedHz: 0.23,
      liftReleaseThreshold01: 0.15,
    },
    teleport: {
      orbTeleportFlickerOnMs: 60,
      orbTeleportFlickerOffMs: 60,
      orbTeleportFadeOutMs: 280,
      orbTeleportFadeInMs: 280,
    },
    behaviors: {
      teleport: TELEPORT_BEHAVIOR_DEFAULT,
    },
  };
  return defaults;
}

export function initOrbStageReceiverVfxRuntime({
  runtime = null,
  vfxDefaults = null,
  playOrbNod3dRuntime = null,
  playOrbTeleport3dRuntime = null,
  playBubbleShield3dRuntime = null,
  playShockwave3dRuntime = null,
  playFlameAoe3dRuntime = null,
  playTesla1Runtime = null,
  requestCameraTravel = null,
  cancelCameraTravel = null,
} = {}) {
  if (!runtime || !vfxDefaults) return null;
  const markTrace = (name, value = {}) => {
    const perfTrace = runtime && runtime.perfTrace;
    if (perfTrace && typeof perfTrace.mark === "function") {
      perfTrace.mark(name, value && typeof value === "object" ? value : {});
    }
  };

  const getTeleportRuntimeConfig = () => ({
    ...(
      vfxDefaults && vfxDefaults.teleport && typeof vfxDefaults.teleport === "object"
        ? vfxDefaults.teleport
        : Object.create(null)
    ),
    ...buildTeleportBehaviorConfig(
      vfxDefaults &&
      vfxDefaults.behaviors &&
      vfxDefaults.behaviors.teleport &&
      typeof vfxDefaults.behaviors.teleport === "object"
        ? vfxDefaults.behaviors.teleport
        : Object.create(null)
    ),
  });
  const teleport3dSequenceRuntime = createTeleportSequenceRuntime({
    getOrbRuntime: () => (
      runtime && runtime.stage && runtime.stage.orbRuntimeState && typeof runtime.stage.orbRuntimeState.get === "function"
        ? runtime.stage.orbRuntimeState.get()
        : null
    ),
    patchOrbRuntime: (patch = {}) => (
      runtime && runtime.stage && runtime.stage.orbRuntimeState && typeof runtime.stage.orbRuntimeState.patch === "function"
        ? runtime.stage.orbRuntimeState.patch(patch)
        : null
    ),
    requestCameraTravel,
    cancelCameraTravel,
    getConfig: getTeleportRuntimeConfig,
    playVisual: (payload = {}) => (
      typeof playOrbTeleport3dRuntime === "function"
        ? playOrbTeleport3dRuntime(payload)
        : { handled: false }
    ),
  });

  function playOrbStageShockwave3dFallback(payload = {}) {
    if (typeof playShockwave3dRuntime === "function") {
      const result = playShockwave3dRuntime({
        ...(vfxDefaults && vfxDefaults.shock3d && typeof vfxDefaults.shock3d === "object"
          ? vfxDefaults.shock3d
          : Object.create(null)),
        ...(payload && typeof payload === "object" ? payload : {}),
      });
      if (result && result.handled) return result;
    }
    return { handled: false };
  }

  function triggerOrbStageShockwaveFallback() {
    const shockwave3dResult = playOrbStageShockwave3dFallback();
    if (shockwave3dResult && shockwave3dResult.handled) return shockwave3dResult;
    return { handled: false };
  }

  function playOrbStageTesla1Fallback(payload = {}) {
    const incomingPayload = payload && typeof payload === "object" ? payload : Object.create(null);
    const defaultPayload = vfxDefaults && vfxDefaults.tesla1 && typeof vfxDefaults.tesla1 === "object"
      ? vfxDefaults.tesla1
      : Object.create(null);
    const playRuntime = playTesla1Runtime;
    markTrace("tesla1.orbStageFallback.called", {
      has3dRuntime: typeof playRuntime === "function",
      payloadKeys: Object.keys(incomingPayload).slice(0, 12),
    });
    if (typeof playRuntime === "function") {
      const result = playRuntime({
        ...defaultPayload,
        ...incomingPayload,
        effect: "tesla-1",
      });
      markTrace("tesla1.orbStageFallback.result", {
        handled: !!(result && result.handled),
        skipped: String(result && result.skipped || ""),
        effect: "tesla-1",
      });
      if (result && result.handled) return result;
    }
    return { handled: false };
  }

  function playOrbStageFlameAoeFallback(payload = {}) {
    markTrace("flameAoe.orbStageFallback.called", {
      has3dRuntime: typeof playFlameAoe3dRuntime === "function",
      payloadKeys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 12) : [],
    });
    if (typeof playFlameAoe3dRuntime === "function") {
      const result = playFlameAoe3dRuntime({
        ...(vfxDefaults && vfxDefaults.flame3d && typeof vfxDefaults.flame3d === "object"
          ? vfxDefaults.flame3d
          : Object.create(null)),
        ...(payload && typeof payload === "object" ? payload : {}),
      });
      markTrace("flameAoe.orbStageFallback.result", {
        handled: !!(result && result.handled),
        skipped: String(result && result.skipped || ""),
        stageResults: Array.isArray(result && result.stageResults)
          ? result.stageResults.map((stageResult) => ({
              handled: !!(stageResult && stageResult.handled),
              skipped: String(stageResult && stageResult.skipped || ""),
              affected: Number(stageResult && stageResult.damageAffected) || 0,
            }))
          : [],
      });
      if (result && result.handled) return result;
    }
    return { handled: false };
  }

  function activateOrbStageBubbleShieldFallback({ durationMs } = {}) {
    const resolvedDurationMs = Math.max(150, Number(durationMs) || Number(vfxDefaults.shield.durationMs) || 8000);
    markTrace("orbStage.bubbleShield.activate.request", {
      durationMs: resolvedDurationMs,
      has3dRuntime: typeof playBubbleShield3dRuntime === "function",
    });
    if (typeof playBubbleShield3dRuntime === "function") {
      const result = playBubbleShield3dRuntime({
        ...(vfxDefaults && vfxDefaults.shield3d && typeof vfxDefaults.shield3d === "object"
          ? vfxDefaults.shield3d
          : Object.create(null)),
        durationMs: resolvedDurationMs,
      });
      markTrace("orbStage.bubbleShield.activate.3d_result", {
        handled: !!(result && result.handled),
        skipped: String(result && result.skipped || ""),
      });
      if (result && result.handled) return result;
    }
    markTrace("orbStage.bubbleShield.activate.failed", {
      durationMs: resolvedDurationMs,
    });
    return { handled: false };
  }

  function playOrbStageOrbNod3dFallback(payload = {}) {
    if (typeof playOrbNod3dRuntime === "function") {
      const result = playOrbNod3dRuntime({
        ...payload,
        config: (vfxDefaults && vfxDefaults.nod3d && typeof vfxDefaults.nod3d === "object")
          ? vfxDefaults.nod3d
          : Object.create(null),
      });
      if (result && result.handled) return result;
    }
    return { handled: false };
  }

  function playOrbStageTeleportFallback(payload = {}) {
    if (typeof playOrbTeleport3dRuntime === "function") {
      const result = teleport3dSequenceRuntime.play(payload);
      if (result && result.handled) return result;
    }
    return { handled: false };
  }

  const shellVfx = {
    vfxDefaults,
    playShock() {
      return playOrbStageShockwave3dFallback();
    },
    triggerShockwave() {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "shockwave",
        runtime: {
          playFlameAoe: () => playOrbStageFlameAoeFallback(),
          playTesla1: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playElectricAoe: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playShockwave3d: (payload = {}) => playOrbStageShockwave3dFallback(payload),
          triggerShockwave: () => triggerOrbStageShockwaveFallback(),
          activateBubbleShield: (payload = {}) => activateOrbStageBubbleShieldFallback(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return triggerOrbStageShockwaveFallback();
    },
    playTesla1(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "tesla_1",
        runtime: {
          playFlameAoe: () => playOrbStageFlameAoeFallback(),
          playTesla1: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playElectricAoe: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playShockwave3d: (payload = {}) => playOrbStageShockwave3dFallback(payload),
          triggerShockwave: () => triggerOrbStageShockwaveFallback(),
          activateBubbleShield: (payload = {}) => activateOrbStageBubbleShieldFallback(payload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playOrbStageTesla1Fallback(payload);
    },
    playElectricAoe(payload = {}) {
      return this.playTesla1({ ...(payload && typeof payload === "object" ? payload : {}), effect: "tesla-1" });
    },
    playFlameAoe(payload = {}) {
      markTrace("flameAoe.shellVfx.called", {
        payloadKeys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 12) : [],
      });
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "aoe_flame",
        runtime: {
          playFlameAoe: (nextPayload = {}) => playOrbStageFlameAoeFallback(nextPayload),
          playTesla1: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playElectricAoe: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playShockwave3d: (payload = {}) => playOrbStageShockwave3dFallback(payload),
          triggerShockwave: () => triggerOrbStageShockwaveFallback(),
          activateBubbleShield: (payload = {}) => activateOrbStageBubbleShieldFallback(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playOrbStageFlameAoeFallback(payload);
    },
    activateBubbleShield({ durationMs } = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "bubble_shield",
        runtime: {
          playFlameAoe: () => playOrbStageFlameAoeFallback(),
          playTesla1: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playElectricAoe: (payload = {}) => playOrbStageTesla1Fallback(payload),
          playShockwave3d: (payload = {}) => playOrbStageShockwave3dFallback(payload),
          triggerShockwave: () => triggerOrbStageShockwaveFallback(),
          activateBubbleShield: (payload = {}) => activateOrbStageBubbleShieldFallback(payload),
        },
        payload: { durationMs },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return activateOrbStageBubbleShieldFallback({ durationMs });
    },
    playTeleport(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "teleport",
        runtime: {
          playTeleport: (nextPayload = {}) => playOrbStageTeleportFallback(nextPayload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playOrbStageTeleportFallback(payload);
    },
    playOrbNod(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "orb-state",
        targetId: "nod",
        runtime: {
          playOrbNod: (nextPayload = {}) => playOrbStageOrbNod3dFallback(nextPayload),
          playOrbNod3d: (nextPayload = {}) => playOrbStageOrbNod3dFallback(nextPayload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playOrbStageOrbNod3dFallback(payload);
    },
    playOrbNod3d(payload = {}) {
      return playOrbStageOrbNod3dFallback(payload);
    },
  };

  runtime.vfx = shellVfx;
  return shellVfx;
}
