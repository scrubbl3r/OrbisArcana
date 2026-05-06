import { dispatchRuntimeEffect } from "../../../vfx/dispatch-runtime-effect.js";
import { createOrbNod3dDomFallbackRuntime } from "../../../vfx/effects/orb-states/orb-nod3d-dom-fallback-runtime.js";
import { createOrbNodRuntime } from "../../../vfx/effects/orb-states/orb-nod-runtime.js";
import { createTeleportRuntime } from "../../../vfx/effects/spells/teleport-runtime.js";
import { TELEPORT_BEHAVIOR_DEFAULT } from "../../../game-runtime/behaviors/teleport-behavior-default.js?v=20260501a";
import { buildTeleportBehaviorConfig } from "../../../game-runtime/behaviors/teleport-behavior-state.js?v=20260501a";
import { createTeleportSequenceRuntime } from "../../../game-runtime/behaviors/teleport-sequence-runtime.js?v=20260501d";
import { BUBBLE_SHIELD_3D_PRESET_DEFAULT } from "../../../vfx/presets/bubble-shield-3d-default.js?v=20260506b";
import { FLAME_AOE_3D_PRESET_DEFAULT } from "../../../vfx/presets/flame-aoe-3d-default.js?v=20260505e";
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
    spawn: {
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
  stageEls = {},
  createVfxRuntimesBundle = null,
  rootStyle = null,
  vfxDefaults = null,
  playElectricAoeRuntime = null,
  playFlameAoeRuntime = null,
  triggerShockwaveRuntime = null,
  playOrbNod3dRuntime = null,
  playOrbTeleport3dRuntime = null,
  playBubbleShield3dRuntime = null,
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
  if (!runtime || typeof createVfxRuntimesBundle !== "function" || !vfxDefaults) return null;
  const readOrbDiameterPx = () => Math.max(
    1,
    Number(getOrbDiameterPx()) || (Math.max(0.01, Number(getOrbScaleFactor()) || 1) * 100)
  );

  const vfxRuntimesBundle = createVfxRuntimesBundle({
    bubbleShield: {
      shieldEl: stageEls.shield,
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
    shockwave: {
      layerEl: stageEls.shockLayer,
      getConfig: () => resolveShockwaveGeometry(vfxDefaults.shock, {
        orbDiameterPx: readOrbDiameterPx(),
        normalizeStroke: (value) => evenStroke(value, 1, 64),
      }),
      clamp,
      normalizeStroke: evenStroke,
    },
    orbShatter: {
      layerEl: stageEls.orbShards,
      clamp,
    },
    flameAoe: {
      layerEl: stageEls.flameLayer,
      getConfig: () => resolveFlameAoeGeometry(vfxDefaults.flame, {
        orbDiameterPx: readOrbDiameterPx(),
      }),
      clamp,
      evenPx,
      showCore: false,
    },
    electricAoe: {
      layerEl: stageEls.electricLayer,
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
    vfxRuntimesBundle,
    bubbleShieldRuntime: vfxRuntimesBundle && vfxRuntimesBundle.bubbleShieldRuntime,
    shockwaveRuntime: vfxRuntimesBundle && vfxRuntimesBundle.shockwaveRuntime,
    orbShatterRuntime: vfxRuntimesBundle && vfxRuntimesBundle.orbShatterRuntime,
    orbNodRuntime: createOrbNodRuntime({
      orbEl: stageEls.orb,
      mountEl: stageEls.orb ? stageEls.orb.parentElement : null,
      orbInteriorEl: stageEls.orbInterior,
      orbCracksEl: stageEls.orbCracks,
      orbShardsEl: stageEls.orbShards,
      getOrbDiameterPx: readOrbDiameterPx,
      getConfig: () => (vfxDefaults && vfxDefaults.nod && typeof vfxDefaults.nod === "object")
        ? vfxDefaults.nod
        : Object.create(null),
    }),
    orbNod3dRuntime: createOrbNod3dDomFallbackRuntime({
      orbEl: stageEls.orb,
      mountEl: stageEls.orb ? stageEls.orb.parentElement : null,
      orbInteriorEl: stageEls.orbInterior,
      orbCracksEl: stageEls.orbCracks,
      orbShardsEl: stageEls.orbShards,
      getOrbDiameterPx: readOrbDiameterPx,
      getConfig: () => (vfxDefaults && vfxDefaults.nod3d && typeof vfxDefaults.nod3d === "object")
        ? vfxDefaults.nod3d
        : Object.create(null),
    }),
    teleportRuntime: createTeleportRuntime({
      orbEl: stageEls.orb,
      orbInteriorEl: stageEls.orbInterior,
      orbCracksEl: stageEls.orbCracks,
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
    flameAoeRuntime: vfxRuntimesBundle && vfxRuntimesBundle.flameAoeRuntime,
    electricAoeRuntime: vfxRuntimesBundle && vfxRuntimesBundle.electricAoeRuntime,
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

  function directPlayShock() {
    if (stageVfx.shockwaveRuntime && typeof stageVfx.shockwaveRuntime.play === "function") {
      stageVfx.shockwaveRuntime.play();
      return { handled: true };
    }
    return { handled: false };
  }

  function directTriggerShockwave() {
    if (typeof triggerShockwaveRuntime === "function") {
      const result = triggerShockwaveRuntime({
        shockwaveRuntime: stageVfx.shockwaveRuntime,
        playShock: () => directPlayShock(),
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.shockwaveRuntime && typeof stageVfx.shockwaveRuntime.trigger === "function") {
      stageVfx.shockwaveRuntime.trigger();
      return { handled: true };
    }
    return directPlayShock();
  }

  function directPlayElectricAoe() {
    if (typeof playElectricAoeRuntime === "function") {
      const result = playElectricAoeRuntime({
        electricAoeRuntime: stageVfx.electricAoeRuntime,
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.electricAoeRuntime && typeof stageVfx.electricAoeRuntime.play === "function") {
      stageVfx.electricAoeRuntime.play();
      return { handled: true };
    }
    return { handled: false };
  }

  function directPlayFlameAoe() {
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
        flameAoeRuntime: stageVfx.flameAoeRuntime,
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.flameAoeRuntime && typeof stageVfx.flameAoeRuntime.play === "function") {
      stageVfx.flameAoeRuntime.play();
      return { handled: true };
    }
    return { handled: false };
  }

  function directActivateBubbleShield({ durationMs } = {}) {
    if (typeof playBubbleShield3dRuntime === "function") {
      const result = playBubbleShield3dRuntime({
        ...(vfxDefaults && vfxDefaults.shield3d && typeof vfxDefaults.shield3d === "object"
          ? vfxDefaults.shield3d
          : Object.create(null)),
        durationMs: Math.max(150, Number(durationMs) || Number(vfxDefaults.shield.durationMs) || 8000),
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.bubbleShieldRuntime && typeof stageVfx.bubbleShieldRuntime.activate === "function") {
      stageVfx.bubbleShieldRuntime.activate({
        durationMs: Math.max(150, Number(durationMs) || Number(vfxDefaults.shield.durationMs) || 8000),
      });
      return { handled: true };
    }
    return { handled: false };
  }

  function directPlayOrbShatter(payload = {}) {
    const controller = runtime && runtime.orbShatterController;
    if (controller && typeof controller.spawnShardFx === "function") {
      controller.spawnShardFx(payload);
      return { handled: true };
    }
    return { handled: false };
  }

  function directPlayOrbNod(payload = {}) {
    if (stageVfx.orbNodRuntime && typeof stageVfx.orbNodRuntime.play === "function") {
      return stageVfx.orbNodRuntime.play(payload);
    }
    return { handled: false };
  }

  function directPlayOrbNod3d(payload = {}) {
    if (typeof playOrbNod3dRuntime === "function") {
      const result = playOrbNod3dRuntime({
        ...payload,
        config: (vfxDefaults && vfxDefaults.nod3d && typeof vfxDefaults.nod3d === "object")
          ? vfxDefaults.nod3d
          : Object.create(null),
      });
      if (result && result.handled) return result;
    }
    if (stageVfx.orbNod3dRuntime && typeof stageVfx.orbNod3dRuntime.play === "function") {
      return stageVfx.orbNod3dRuntime.play(payload);
    }
    return { handled: false };
  }

  function directPlayTeleport(payload = {}) {
    if (typeof playOrbTeleport3dRuntime === "function") {
      const result = teleport3dSequenceRuntime.play(payload);
      if (result && result.handled) return result;
    }
    if (stageVfx.teleportRuntime && typeof stageVfx.teleportRuntime.play === "function") {
      return stageVfx.teleportRuntime.play(payload);
    }
    return { handled: false };
  }

  const shellVfx = {
    ...stageVfx,
    playShock() {
      return directPlayShock();
    },
    triggerShockwave() {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "shockwave",
        runtime: {
          playFlameAoe: () => directPlayFlameAoe(),
          playElectricAoe: () => directPlayElectricAoe(),
          triggerShockwave: () => directTriggerShockwave(),
          activateBubbleShield: (payload = {}) => directActivateBubbleShield(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directTriggerShockwave();
    },
    playElectricAoe() {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "aoe_electric",
        runtime: {
          playFlameAoe: () => directPlayFlameAoe(),
          playElectricAoe: () => directPlayElectricAoe(),
          triggerShockwave: () => directTriggerShockwave(),
          activateBubbleShield: (payload = {}) => directActivateBubbleShield(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directPlayElectricAoe();
    },
    playFlameAoe() {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "aoe_flame",
        runtime: {
          playFlameAoe: () => directPlayFlameAoe(),
          playElectricAoe: () => directPlayElectricAoe(),
          triggerShockwave: () => directTriggerShockwave(),
          activateBubbleShield: (payload = {}) => directActivateBubbleShield(payload),
        },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directPlayFlameAoe();
    },
    activateBubbleShield({ durationMs } = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "bubble_shield",
        runtime: {
          playFlameAoe: () => directPlayFlameAoe(),
          playElectricAoe: () => directPlayElectricAoe(),
          triggerShockwave: () => directTriggerShockwave(),
          activateBubbleShield: (payload = {}) => directActivateBubbleShield(payload),
        },
        payload: { durationMs },
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directActivateBubbleShield({ durationMs });
    },
    playTeleport(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "spell",
        targetId: "teleport",
        runtime: {
          playTeleport: (nextPayload = {}) => directPlayTeleport(nextPayload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directPlayTeleport(payload);
    },
    playOrbShatter(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "orb-state",
        targetId: "shattered",
        runtime: {
          playOrbShatter: (nextPayload = {}) => directPlayOrbShatter(nextPayload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directPlayOrbShatter(payload);
    },
    playOrbNod(payload = {}) {
      const dispatched = dispatchRuntimeEffect({
        targetKind: "orb-state",
        targetId: "nod",
        runtime: {
          playOrbNod: (nextPayload = {}) => directPlayOrbNod(nextPayload),
          playOrbNod3d: (nextPayload = {}) => directPlayOrbNod3d(nextPayload),
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directPlayOrbNod(payload);
    },
    playOrbNod3d(payload = {}) {
      return directPlayOrbNod3d(payload);
    },
  };

  runtime.vfx = shellVfx;
  return shellVfx;
}
