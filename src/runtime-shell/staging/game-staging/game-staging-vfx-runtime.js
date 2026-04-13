import { dispatchRuntimeEffect } from "../../../vfx/dispatch-runtime-effect.js";

export function createGameStagingReceiverVfxDefaults({ evenStroke = (value) => value } = {}) {
  const defaults = {
    shield: {
      colorRgb: { r: 120, g: 210, b: 255 },
      diameterPx: 124,
      strokeWidthPx: 4,
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
      diameter: 200,
      durationMs: 10000,
    },
    electric: {
      startR: 80,
      endR: 200,
      durationMs: 10000,
      nodeCount: 13,
      particleCount: 340,
      particleSpeed: 0.62,
      maxBoltJumpSq: 1200,
      startJitterRatio: 0.3,
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
} = {}) {
  if (!runtime || typeof createVfxRuntimesBundle !== "function" || !vfxDefaults) return null;

  const scaleGeomPx = (value, { stroke = false } = {}) => {
    const scale = Math.max(0.01, Number(getOrbScaleFactor()) || 1);
    const scaled = Math.max(0, (Number(value) || 0) * scale);
    return stroke ? evenStroke(scaled, 1, 64) : scaled;
  };

  const scaleGeomSq = (value) => {
    const scale = Math.max(0.01, Number(getOrbScaleFactor()) || 1);
    return Math.max(0, (Number(value) || 0) * scale * scale);
  };

  const vfxRuntimesBundle = createVfxRuntimesBundle({
    bubbleShield: {
      shieldEl: stageEls.shield,
      getConfig: () => ({
        colorRgb: vfxDefaults.shield.colorRgb,
        diameterPx: scaleGeomPx(vfxDefaults.shield.diameterPx),
        strokeWidthPx: scaleGeomPx(vfxDefaults.shield.strokeWidthPx, { stroke: true }),
        durationMs: vfxDefaults.shield.durationMs,
        alpha: vfxDefaults.shield.alpha,
        pulseMs: vfxDefaults.shield.pulseMs,
        pulseMin: vfxDefaults.shield.pulseMin,
        pulseMax: vfxDefaults.shield.pulseMax,
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
      getConfig: () => ({
        color: vfxDefaults.shock.color,
        startR: scaleGeomPx(vfxDefaults.shock.startR),
        endR: scaleGeomPx(vfxDefaults.shock.endR),
        rings: vfxDefaults.shock.rings,
        spawnMs: vfxDefaults.shock.spawnMs,
        decayMs: vfxDefaults.shock.decayMs,
        stroke: scaleGeomPx(vfxDefaults.shock.stroke, { stroke: true }),
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
      getConfig: () => ({
        diameter: scaleGeomPx(vfxDefaults.flame.diameter),
        durationMs: vfxDefaults.flame.durationMs,
        stroke: vfxDefaults.flame.stroke,
        fill: vfxDefaults.flame.fill,
      }),
      clamp,
      evenPx,
      showCore: false,
    },
    electricAoe: {
      layerEl: stageEls.electricLayer,
      getConfig: () => ({
        startR: scaleGeomPx(vfxDefaults.electric.startR),
        endR: scaleGeomPx(vfxDefaults.electric.endR),
        durationMs: vfxDefaults.electric.durationMs,
        nodeCount: vfxDefaults.electric.nodeCount,
        particleCount: vfxDefaults.electric.particleCount,
        particleSpeed: vfxDefaults.electric.particleSpeed,
        maxBoltJumpSq: scaleGeomSq(vfxDefaults.electric.maxBoltJumpSq),
        startJitterRatio: vfxDefaults.electric.startJitterRatio,
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
  };

  runtime.vfx = shellVfx;
  return shellVfx;
}
