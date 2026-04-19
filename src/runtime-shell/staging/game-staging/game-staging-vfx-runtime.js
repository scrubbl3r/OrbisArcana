import { dispatchRuntimeEffect } from "../../../vfx/dispatch-runtime-effect.js";
import { createOrbNodRuntime } from "../../../vfx/effects/orb-states/orb-nod-runtime.js";
import { createTeleportRuntime } from "../../../vfx/effects/spells/teleport-runtime.js";
import { TELEPORT_BEHAVIOR_DEFAULT } from "../../../game-runtime/behaviors/teleport-behavior-default.js";
import { buildTeleportBehaviorConfig } from "../../../game-runtime/behaviors/teleport-behavior-state.js";
import {
  resolveBubbleShieldGeometry,
  resolveElectricAoeGeometry,
  resolveFlameAoeGeometry,
  resolveShockwaveGeometry,
} from "../../../game-runtime/orb/orb-spell-geometry.js";

export function createGameStagingReceiverVfxDefaults({ evenStroke = (value) => value } = {}) {
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
    shock: {
      color: { r: 255, g: 255, b: 255, a: 0.65 },
      startR: 43,
      endR: 169,
      rings: 2,
      spawnMs: 105,
      stroke: 4,
      decayMs: 150,
    },
    flame: {
      diameterRatio: 2.0,
      durationMs: 10000,
    },
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
  defaults.shock.stroke = evenStroke(defaults.shock.stroke, 2, 20);
  return defaults;
}

export function initGameStagingReceiverVfxRuntime({
  runtime = null,
  stageEls = {},
  createVfxRuntimesBundle = null,
  rootStyle = null,
  vfxDefaults = null,
  playElectricAoeRuntime = null,
  playFlameAoeRuntime = null,
  triggerShockwaveRuntime = null,
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

  function directPlayTeleport(payload = {}) {
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
        },
        payload,
      });
      if (dispatched && dispatched.handled) return dispatched;
      return directPlayOrbNod(payload);
    },
  };

  runtime.vfx = shellVfx;
  return shellVfx;
}
