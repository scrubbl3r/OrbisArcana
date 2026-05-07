import { dispatchRuntimeEffect } from "../../../vfx/dispatch-runtime-effect.js?v=20260506a";
import { createLegacyDomOrbNod3dRuntime } from "../../../vfx/effects/orb-states/orb-nod3d-legacy-dom-runtime.js";
import { createLegacyDomOrbNodRuntime } from "../../../vfx/effects/orb-states/orb-nod-legacy-dom-runtime.js";
import { createLegacyDomTeleportRuntime } from "../../../vfx/effects/spells/teleport-legacy-dom-runtime.js";
import { TELEPORT_BEHAVIOR_DEFAULT } from "../../../game-runtime/behaviors/teleport-behavior-default.js?v=20260501a";
import { buildTeleportBehaviorConfig } from "../../../game-runtime/behaviors/teleport-behavior-state.js?v=20260501a";
import { createTeleportSequenceRuntime } from "../../../game-runtime/behaviors/teleport-sequence-runtime.js?v=20260501d";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../../../vfx/presets/bubble-shield-3d-default.js?v=20260506d";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../../../vfx/presets/flame-aoe-3d-default.js?v=20260505e";
import { SHOCKWAVE_3D_PRESET_DEFAULT } from "../../../vfx/presets/shockwave-3d-default.js?v=20260506a";
import {
  resolveBubbleShieldGeometry,
  resolveElectricAoeGeometry,
  resolveFlameAoeGeometry,
  resolveShockwaveGeometry,
} from "../../../game-runtime/orb/orb-spell-geometry.js";

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
  orbStageLegacyDomEls = {},
  createLegacyDomVfxRuntimesBundle = null,
  rootStyle = null,
  vfxDefaults = null,
  playElectricAoeRuntime = null,
  playFlameAoeRuntime = null,
  triggerShockwaveRuntime = null,
  playOrbNod3dRuntime = null,
  playOrbTeleport3dRuntime = null,
  playBubbleShield3dRuntime = null,
  playShockwave3dRuntime = null,
  playFlameAoe3dRuntime = null,
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0)),
  evenPx = (value) => value,
  evenStroke = (value) => value,
  rand = (min, max) => Number(min) + (Math.random() * (Number(max) - Number(min))),
  getOrbScaleFactor = () => 1,
  getOrbDiameterPx = () => Math.max(1, Number(getOrbScaleFactor()) || 1) * 100,
  requestCameraTravel = null,
  cancelCameraTravel = null,
} = {}) {
  if (!runtime || typeof createLegacyDomVfxRuntimesBundle !== "function" || !vfxDefaults) return null;
  const legacyDomEls = orbStageLegacyDomEls || {};
  const readOrbDiameterPx = () => Math.max(
    1,
    Number(getOrbDiameterPx()) || (Math.max(0.01, Number(getOrbScaleFactor()) || 1) * 100)
  );
  const markTrace = (name, value = {}) => {
    const perfTrace = runtime && runtime.perfTrace;
    if (perfTrace && typeof perfTrace.mark === "function") {
      perfTrace.mark(name, value && typeof value === "object" ? value : {});
    }
  };

  const legacyDomVfxRuntimesBundle = createLegacyDomVfxRuntimesBundle({
    legacyDomBubbleShield: {
      shieldEl: legacyDomEls.shield,
      getConfig: () => resolveBubbleShieldGeometry(vfxDefaults.shield, {
        orbDiameterPx: readOrbDiameterPx(),
        normalizeStroke: (value) => evenStroke(value, 1, 64),
      }),
      setCssVar: (name, value) => {
        if (rootStyle) rootStyle.setProperty(name, value);
      },
      clamp,
      clamp01,
      fadeInMs: 750,
      decayMs: 2000,
      onDecayActiveChange: () => {},
    },
    legacyDomShockwave: {
      layerEl: legacyDomEls.shockLayer,
      getConfig: () => resolveShockwaveGeometry(vfxDefaults.shock, {
        orbDiameterPx: readOrbDiameterPx(),
        normalizeStroke: (value) => evenStroke(value, 1, 64),
      }),
      clamp,
      normalizeStroke: evenStroke,
    },
    legacyDomOrbShatter: {
      layerEl: legacyDomEls.orbShards,
      clamp,
    },
    legacyDomFlameAoe: {
      layerEl: legacyDomEls.flameLayer,
      getConfig: () => resolveFlameAoeGeometry(vfxDefaults.flame, {
        orbDiameterPx: readOrbDiameterPx(),
      }),
      clamp,
      evenPx,
      showCore: false,
    },
    legacyDomElectricAoe: {
      layerEl: legacyDomEls.electricLayer,
      getConfig: () => resolveElectricAoeGeometry(vfxDefaults.electric, {
        orbDiameterPx: readOrbDiameterPx(),
      }),
      clamp,
      evenPx,
      rand,
    },
  });

  const stageVfx = {
    vfxDefaults,
    legacyDomBubbleShieldRuntime: legacyDomVfxRuntimesBundle && legacyDomVfxRuntimesBundle.legacyDomBubbleShieldRuntime,
    legacyDomShockwaveRuntime: legacyDomVfxRuntimesBundle && legacyDomVfxRuntimesBundle.legacyDomShockwaveRuntime,
    legacyDomOrbShatterRuntime: legacyDomVfxRuntimesBundle && legacyDomVfxRuntimesBundle.legacyDomOrbShatterRuntime,
    legacyDomOrbNodRuntime: createLegacyDomOrbNodRuntime({
      orbEl: legacyDomEls.orb,
      mountEl: legacyDomEls.orb ? legacyDomEls.orb.parentElement : null,
      orbInteriorEl: legacyDomEls.orbInterior,
      orbCracksEl: legacyDomEls.orbCracks,
      orbShardsEl: legacyDomEls.orbShards,
      getOrbDiameterPx: readOrbDiameterPx,
      getConfig: () => (vfxDefaults && vfxDefaults.nod && typeof vfxDefaults.nod === "object")
        ? vfxDefaults.nod
        : Object.create(null),
    }),
    legacyDomOrbNod3dRuntime: createLegacyDomOrbNod3dRuntime({
      orbEl: legacyDomEls.orb,
      mountEl: legacyDomEls.orb ? legacyDomEls.orb.parentElement : null,
      orbInteriorEl: legacyDomEls.orbInterior,
      orbCracksEl: legacyDomEls.orbCracks,
      orbShardsEl: legacyDomEls.orbShards,
      getOrbDiameterPx: readOrbDiameterPx,
      getConfig: () => (vfxDefaults && vfxDefaults.nod3d && typeof vfxDefaults.nod3d === "object")
        ? vfxDefaults.nod3d
        : Object.create(null),
    }),
    legacyDomTeleportRuntime: createLegacyDomTeleportRuntime({
      orbEl: legacyDomEls.orb,
      orbInteriorEl: legacyDomEls.orbInterior,
      orbCracksEl: legacyDomEls.orbCracks,
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
      requestCameraTravel: (payload = {}) => (
        typeof requestCameraTravel === "function"
          ? requestCameraTravel(payload)
          : Promise.resolve({ handled: false })
      ),
      cancelCameraTravel: () => {
        if (typeof cancelCameraTravel === "function") cancelCameraTravel();
      },
      getConfig: () => ({
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
      }),
    }),
    legacyDomFlameAoeRuntime: legacyDomVfxRuntimesBundle && legacyDomVfxRuntimesBundle.legacyDomFlameAoeRuntime,
    legacyDomElectricAoeRuntime: legacyDomVfxRuntimesBundle && legacyDomVfxRuntimesBundle.legacyDomElectricAoeRuntime,
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

  function playOrbStageShockFallback() {
    if (stageVfx.legacyDomShockwaveRuntime && typeof stageVfx.legacyDomShockwaveRuntime.play === "function") {
      stageVfx.legacyDomShockwaveRuntime.play();
      return { handled: true };
    }
    return { handled: false };
  }

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
    if (typeof triggerShockwaveRuntime === "function") {
      const result = triggerShockwaveRuntime({
        legacyDomShockwaveRuntime: stageVfx.legacyDomShockwaveRuntime,
        playShock: () => playOrbStageShockFallback(),
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.legacyDomShockwaveRuntime && typeof stageVfx.legacyDomShockwaveRuntime.trigger === "function") {
      stageVfx.legacyDomShockwaveRuntime.trigger();
      return { handled: true };
    }
    return playOrbStageShockFallback();
  }

  function playOrbStageElectricAoeFallback() {
    if (typeof playElectricAoeRuntime === "function") {
      const result = playElectricAoeRuntime({
        legacyDomElectricAoeRuntime: stageVfx.legacyDomElectricAoeRuntime,
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.legacyDomElectricAoeRuntime && typeof stageVfx.legacyDomElectricAoeRuntime.play === "function") {
      stageVfx.legacyDomElectricAoeRuntime.play();
      return { handled: true };
    }
    return { handled: false };
  }

  function playOrbStageFlameAoeFallback() {
    if (typeof playFlameAoe3dRuntime === "function") {
      const result = playFlameAoe3dRuntime(
        (vfxDefaults && vfxDefaults.flame3d && typeof vfxDefaults.flame3d === "object")
          ? vfxDefaults.flame3d
          : Object.create(null)
      );
      if (result && result.handled) return result;
    }
    if (typeof playFlameAoeRuntime === "function") {
      const result = playFlameAoeRuntime({
        legacyDomFlameAoeRuntime: stageVfx.legacyDomFlameAoeRuntime,
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.legacyDomFlameAoeRuntime && typeof stageVfx.legacyDomFlameAoeRuntime.play === "function") {
      stageVfx.legacyDomFlameAoeRuntime.play();
      return { handled: true };
    }
    return { handled: false };
  }

  function activateOrbStageBubbleShieldFallback({ durationMs } = {}) {
    const resolvedDurationMs = Math.max(150, Number(durationMs) || Number(vfxDefaults.shield.durationMs) || 8000);
    markTrace("orbStage.bubbleShield.activate.request", {
      durationMs: resolvedDurationMs,
      has3dRuntime: typeof playBubbleShield3dRuntime === "function",
      hasLegacyDomRuntime: !!(stageVfx.legacyDomBubbleShieldRuntime && typeof stageVfx.legacyDomBubbleShieldRuntime.activate === "function"),
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
    if (stageVfx.legacyDomBubbleShieldRuntime && typeof stageVfx.legacyDomBubbleShieldRuntime.activate === "function") {
      stageVfx.legacyDomBubbleShieldRuntime.activate({
        durationMs: resolvedDurationMs,
      });
      markTrace("orbStage.bubbleShield.activate.legacy_dom_runtime", {
        durationMs: resolvedDurationMs,
      });
      return { handled: true };
    }
    markTrace("orbStage.bubbleShield.activate.failed", {
      durationMs: resolvedDurationMs,
    });
    return { handled: false };
  }

  function playLegacyDomOrbShatterFallback(payload = {}) {
    const controller = runtime && runtime.legacyDomOrbShatterController;
    if (controller && typeof controller.spawnShardVfx === "function") {
      controller.spawnShardVfx(payload);
      return { handled: true };
    }
    return { handled: false };
  }

  function getLegacyDomOrbShatterRuntime() {
    return stageVfx.legacyDomOrbShatterRuntime || null;
  }

  function clearLegacyDomOrbShatterRuntime() {
    const shatterRuntime = getLegacyDomOrbShatterRuntime();
    if (shatterRuntime && typeof shatterRuntime.clear === "function") {
      shatterRuntime.clear();
      return { handled: true };
    }
    return { handled: false };
  }

  function playOrbStageOrbNodFallback(payload = {}) {
    if (stageVfx.legacyDomOrbNodRuntime && typeof stageVfx.legacyDomOrbNodRuntime.play === "function") {
      return stageVfx.legacyDomOrbNodRuntime.play(payload);
    }
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
    if (
      stageVfx.legacyDomOrbNod3dRuntime &&
      typeof stageVfx.legacyDomOrbNod3dRuntime.play === "function"
    ) {
      return stageVfx.legacyDomOrbNod3dRuntime.play(payload);
    }
    return { handled: false };
  }

  function playOrbStageTeleportFallback(payload = {}) {
    if (typeof playOrbTeleport3dRuntime === "function") {
      const result = teleport3dSequenceRuntime.play(payload);
      if (result && result.handled) return result;
    }
    if (stageVfx.legacyDomTeleportRuntime && typeof stageVfx.legacyDomTeleportRuntime.play === "function") {
      return stageVfx.legacyDomTeleportRuntime.play(payload);
    }
    return { handled: false };
  }

  function clearLegacyDomOrbDeathVfx() {
    if (stageVfx.legacyDomShockwaveRuntime && typeof stageVfx.legacyDomShockwaveRuntime.clear === "function") {
      stageVfx.legacyDomShockwaveRuntime.clear();
    }
    if (stageVfx.legacyDomFlameAoeRuntime && typeof stageVfx.legacyDomFlameAoeRuntime.clear === "function") {
      stageVfx.legacyDomFlameAoeRuntime.clear();
    }
    if (stageVfx.legacyDomElectricAoeRuntime && typeof stageVfx.legacyDomElectricAoeRuntime.clear === "function") {
      stageVfx.legacyDomElectricAoeRuntime.clear();
    }
    if (stageVfx.legacyDomBubbleShieldRuntime && typeof stageVfx.legacyDomBubbleShieldRuntime.off === "function") {
      stageVfx.legacyDomBubbleShieldRuntime.off();
    }
    if (stageVfx.legacyDomOrbNodRuntime && typeof stageVfx.legacyDomOrbNodRuntime.clear === "function") {
      stageVfx.legacyDomOrbNodRuntime.clear();
    }
    if (stageVfx.legacyDomTeleportRuntime && typeof stageVfx.legacyDomTeleportRuntime.clear === "function") {
      stageVfx.legacyDomTeleportRuntime.clear();
    }
  }

  const shellVfx = {
    vfxDefaults,
    clearLegacyDomOrbDeathVfx,
    clearLegacyDomOrbShatterRuntime,
    getLegacyDomOrbShatterRuntime,
    playShock() {
      return playOrbStageShockFallback();
    },
    triggerShockwave() {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "shockwave",
        runtime: {
          playFlameAoe: () => playOrbStageFlameAoeFallback(),
          playElectricAoe: () => playOrbStageElectricAoeFallback(),
          playShockwave3d: (payload = {}) => playOrbStageShockwave3dFallback(payload),
          triggerShockwave: () => triggerOrbStageShockwaveFallback(),
          activateBubbleShield: (payload = {}) => activateOrbStageBubbleShieldFallback(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return triggerOrbStageShockwaveFallback();
    },
    playElectricAoe() {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "aoe_electric",
        runtime: {
          playFlameAoe: () => playOrbStageFlameAoeFallback(),
          playElectricAoe: () => playOrbStageElectricAoeFallback(),
          playShockwave3d: (payload = {}) => playOrbStageShockwave3dFallback(payload),
          triggerShockwave: () => triggerOrbStageShockwaveFallback(),
          activateBubbleShield: (payload = {}) => activateOrbStageBubbleShieldFallback(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playOrbStageElectricAoeFallback();
    },
    playFlameAoe() {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "aoe_flame",
        runtime: {
          playFlameAoe: () => playOrbStageFlameAoeFallback(),
          playElectricAoe: () => playOrbStageElectricAoeFallback(),
          playShockwave3d: (payload = {}) => playOrbStageShockwave3dFallback(payload),
          triggerShockwave: () => triggerOrbStageShockwaveFallback(),
          activateBubbleShield: (payload = {}) => activateOrbStageBubbleShieldFallback(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playOrbStageFlameAoeFallback();
    },
    activateBubbleShield({ durationMs } = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "bubble_shield",
        runtime: {
          playFlameAoe: () => playOrbStageFlameAoeFallback(),
          playElectricAoe: () => playOrbStageElectricAoeFallback(),
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
    playOrbShatter(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "orb-state",
        targetId: "shattered",
        runtime: {
          playOrbShatter: (nextPayload = {}) => playLegacyDomOrbShatterFallback(nextPayload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playLegacyDomOrbShatterFallback(payload);
    },
    playOrbNod(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "orb-state",
        targetId: "nod",
        runtime: {
          playOrbNod: (nextPayload = {}) => playOrbStageOrbNodFallback(nextPayload),
          playOrbNod3d: (nextPayload = {}) => playOrbStageOrbNod3dFallback(nextPayload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return playOrbStageOrbNodFallback(payload);
    },
    playOrbNod3d(payload = {}) {
      return playOrbStageOrbNod3dFallback(payload);
    },
  };

  runtime.vfx = shellVfx;
  return shellVfx;
}
