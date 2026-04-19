import {
  resolveBubbleShieldGeometry,
  resolveElectricAoeGeometry,
  resolveFlameAoeGeometry,
} from "../../game-runtime/orb/orb-spell-geometry.js";

export function bootstrapGameStagingRuntime({
  createVfxRuntimesBundle = null,
  createOrbShatterRuntimeController = null,
  createOrbRuntimeState = null,
  createOrbRuntimeLoop = null,
  documentRoot = null,
  els = {},
  orbColorRuntime = null,
  orbRuntimeFallbackState = null,
  existingOrbRuntimeLoop = null,
  getOrbRuntime = () => null,
  runOrbRuntimePipelineModule = null,
  PHYS = null,
  SHIELD_DESCENT = null,
  mvp = null,
  orbFxSystem = null,
  worldSystem = null,
  getMvp = null,
  getOrbFxSystem = null,
  getWorldSystem = null,
  getPhys = null,
  getShieldDescent = null,
  VFX_DEFAULTS = {},
  SHIELD_FADEIN_MS = 0,
  SHIELD_DECAY_MS = 0,
  FLAME_SHOW_CORE = false,
  ORB_FILL_ALPHA = 1,
  shieldDecay = {},
  hooks = {},
} = {}) {
  const {
    setVar = () => {},
    clamp = (value) => value,
    clamp01 = (value) => value,
    evenStroke = (value) => value,
    evenPx = (value) => value,
    rand = Math.random,
    liftToThrustAccel = () => 0,
    isFloatGraceActive = () => false,
    clearFloatGrace = () => {},
    groundCenterWorld = () => 0,
    computeImpactMetric = () => 0,
    drawStars = () => {},
    drawWorldBackdrop = () => {},
    updateOrbStrokeColor = () => {},
    applyOrbTransform = () => {},
    updateDebugReadout = () => {},
  } = hooks;

  let vfxRuntimesBundle = null;
  let bubbleShieldRuntime = null;
  let shockwaveRuntime = null;
  let orbShatterRuntime = null;
  let flameAoeRuntime = null;
  let electricAoeRuntime = null;
  let orbShatterController = null;
  let orbRuntimeState = null;
  let orbRuntimeLoop = existingOrbRuntimeLoop;
  const readOrbDiameterPx = () => Math.max(1, Number(PHYS && PHYS.orbRadiusPx) || 0) * 2 || 100;

  if (typeof createVfxRuntimesBundle === "function") {
    vfxRuntimesBundle = createVfxRuntimesBundle({
      bubbleShield: {
        shieldEl: els.shield,
        getConfig: () => resolveBubbleShieldGeometry({
          colorRgb: VFX_DEFAULTS.shield.colorRgb,
          diameterRatio: VFX_DEFAULTS.shield.diameterRatio,
          strokeWidthRatio: VFX_DEFAULTS.shield.strokeWidthRatio,
          diameterPx: VFX_DEFAULTS.shield.diameterPx,
          strokeWidthPx: VFX_DEFAULTS.shield.strokeWidthPx,
          durationMs: VFX_DEFAULTS.shield.durationMs,
          alpha: VFX_DEFAULTS.shield.alpha,
          pulseMs: VFX_DEFAULTS.shield.pulseMs,
          pulseMin: VFX_DEFAULTS.shield.pulseMin,
          pulseMax: VFX_DEFAULTS.shield.pulseMax,
        }, {
          orbDiameterPx: readOrbDiameterPx(),
          normalizeStroke: (value) => evenStroke(value, 1, 64),
        }),
        setCssVar: (name, value) => setVar(name, value),
        clamp,
        clamp01,
        fadeInMs: SHIELD_FADEIN_MS,
        decayMs: SHIELD_DECAY_MS,
        onDecayActiveChange: (active) => {
          if (typeof shieldDecay.setActive === "function") shieldDecay.setActive(active);
        },
      },
      shockwave: {
        layerEl: els.shockLayer,
        getConfig: () => ({
          color: VFX_DEFAULTS.shock.color,
          startR: VFX_DEFAULTS.shock.startR,
          endR: VFX_DEFAULTS.shock.endR,
          rings: VFX_DEFAULTS.shock.rings,
          spawnMs: VFX_DEFAULTS.shock.spawnMs,
          decayMs: VFX_DEFAULTS.shock.decayMs,
          stroke: VFX_DEFAULTS.shock.stroke,
        }),
        clamp,
        normalizeStroke: evenStroke,
      },
      orbShatter: {
        layerEl: els.orbShards,
        clamp,
      },
      flameAoe: {
        layerEl: els.flameLayer,
        getConfig: () => resolveFlameAoeGeometry({
          diameterRatio: VFX_DEFAULTS.flame.diameterRatio,
          diameter: VFX_DEFAULTS.flame.diameter,
          durationMs: VFX_DEFAULTS.flame.durationMs,
          stroke: VFX_DEFAULTS.flame.stroke,
          fill: VFX_DEFAULTS.flame.fill,
        }, {
          orbDiameterPx: readOrbDiameterPx(),
        }),
        clamp,
        evenPx,
        showCore: FLAME_SHOW_CORE,
      },
      electricAoe: {
        layerEl: els.electricLayer,
        getConfig: () => resolveElectricAoeGeometry({
          startRatio: VFX_DEFAULTS.electric.startRatio,
          endRatio: VFX_DEFAULTS.electric.endRatio,
          startR: VFX_DEFAULTS.electric.startR,
          endR: VFX_DEFAULTS.electric.endR,
          durationMs: VFX_DEFAULTS.electric.durationMs,
          nodeCount: VFX_DEFAULTS.electric.nodeCount,
          particleCount: VFX_DEFAULTS.electric.particleCount,
          particleSpeed: VFX_DEFAULTS.electric.particleSpeed,
          maxBoltJumpSq: VFX_DEFAULTS.electric.maxBoltJumpSq,
          startJitterRatio: VFX_DEFAULTS.electric.startJitterRatio,
        }, {
          orbDiameterPx: readOrbDiameterPx(),
        }),
        clamp,
        evenPx,
        rand,
      },
    });
    bubbleShieldRuntime = vfxRuntimesBundle.bubbleShieldRuntime;
    shockwaveRuntime = vfxRuntimesBundle.shockwaveRuntime;
    orbShatterRuntime = vfxRuntimesBundle.orbShatterRuntime;
    flameAoeRuntime = vfxRuntimesBundle.flameAoeRuntime;
    electricAoeRuntime = vfxRuntimesBundle.electricAoeRuntime;
    orbShatterController = (typeof createOrbShatterRuntimeController === "function")
      ? createOrbShatterRuntimeController({
          root: documentRoot,
          getOrbEl: () => els.orb,
          getOrbShatterRuntime: () => orbShatterRuntime,
          getOrbColorState: () => (
            orbColorRuntime && typeof orbColorRuntime.getCurrentState === "function"
              ? orbColorRuntime.getCurrentState()
              : null
          ),
          getBaseFillAlpha: () => ORB_FILL_ALPHA,
          clamp,
          clamp01,
        })
      : null;
  }

  if (typeof createOrbRuntimeState === "function") {
    orbRuntimeState = createOrbRuntimeState({ initialState: orbRuntimeFallbackState });
  }

  if (typeof createOrbRuntimeLoop === "function") {
    if (orbRuntimeLoop && typeof orbRuntimeLoop.stop === "function") {
      orbRuntimeLoop.stop();
    }
    orbRuntimeLoop = createOrbRuntimeLoop({
      getState: () => getOrbRuntime(),
      isReady: () => (typeof runOrbRuntimePipelineModule === "function"),
      clamp,
      runFrame: ({ ts, dt, nowMs, wasOnGround }) => {
        runOrbRuntimePipelineModule({
          ts,
          dt,
          nowMs,
          wasOnGround,
          orbRuntimeState,
          phys: (typeof getPhys === "function" ? getPhys() : PHYS),
          shieldDescent: (typeof getShieldDescent === "function" ? getShieldDescent() : SHIELD_DESCENT),
          mvp: (typeof getMvp === "function" ? getMvp() : mvp),
          orbFxSystem: (typeof getOrbFxSystem === "function" ? getOrbFxSystem() : orbFxSystem),
          worldSystem: (typeof getWorldSystem === "function" ? getWorldSystem() : worldSystem),
          hooks: {
            clamp,
            liftToThrustAccel,
            isFloatGraceActive,
            clearFloatGrace,
            groundCenterWorld,
            computeImpactMetric,
            drawStars,
            drawWorldBackdrop,
            updateOrbStrokeColor,
            applyOrbTransform,
            updateDebugReadout,
          },
        });
      },
    });
    orbRuntimeLoop.start();
  }

  return {
    vfxRuntimesBundle,
    bubbleShieldRuntime,
    shockwaveRuntime,
    orbShatterRuntime,
    flameAoeRuntime,
    electricAoeRuntime,
    orbShatterController,
    orbRuntimeState,
    orbRuntimeLoop,
  };
}
