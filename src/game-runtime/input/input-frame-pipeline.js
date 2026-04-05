function clamp01(n){
  n = Number(n);
  if (!isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

/**
 * @typedef {Object} RunInputFramePipelineOptions
 * @property {Object} [d] Raw incoming payload from receiver/transmitter path.
 * @property {Object|null} [frame] Normalized latest frame from input-system.
 * @property {number} [nowMs]
 * @property {{energyFromPhone?:number, groove?:number, dynamics?:number, smooth?:number, speed?:number, shake?:number, locked?:boolean}} [values]
 * @property {{inputGestureSystem?:Object, inputDynamicsSystem?:Object}} [systems]
 * @property {{physState?:Object, orbRuntimeState?:{get?:() => Object}}} [runtime]
 * @property {{inputDynamics?:Object}} [configs]
 * @property {Object} [hooks] Receiver-provided hooks for gesture/stability side effects.
 * @property {boolean} [skipPhysStatePatch] When true, do not mutate orb runtime scalar state inside the legacy pipeline.
 * @property {boolean} [skipLegacyHudFields] When true, skip legacy HUD-only return shaping that is no longer consumed.
 */

/**
 * Run the receiver input-frame orchestration in the correct order (behavior-preserving extraction).
 *
 * Side effects are performed via injected hooks/systems; this function returns the processed
 * values needed by the HUD view-model builder.
 *
 * @param {RunInputFramePipelineOptions} [options]
 * @returns {{nowMs:number, lift:number, groove:number, smooth:number, speed:number, dynamics:number, shake:number, locked:boolean, energyUI01:number, shieldRgb01:(number[]|null)}}
 */
export function runInputFramePipeline({
  d,
  frame,
  nowMs,
  values,
  systems,
  runtime,
  configs,
  hooks,
  skipPhysStatePatch = false,
  skipLegacyHudFields = false,
} = {}){
  const energyFromPhone = Number(values && values.energyFromPhone) || 0;
  const groove = Number(values && values.groove) || 0;
  const dynamics = Number(values && values.dynamics) || 0;
  const smooth = Number(values && values.smooth) || 0;
  const speed = Number(values && values.speed) || 0;
  const shake = Number(values && values.shake) || 0;
  const locked = !!(values && values.locked);

  const physState = (runtime && runtime.orbRuntimeState && typeof runtime.orbRuntimeState.get === "function")
    ? runtime.orbRuntimeState.get()
    : (runtime && runtime.physState);
  const inputGestureSystem = systems && systems.inputGestureSystem;
  const inputDynamicsSystem = systems && systems.inputDynamicsSystem;
  const inputDynamicsCfg = (configs && configs.inputDynamics) || {};

  const computeLift01 = hooks && hooks.computeLift01;
  const setStabilityVisualGate = hooks && hooks.setStabilityVisualGate;
  const applyStabilityVisuals = hooks && hooks.applyStabilityVisuals;
  const processShakeDoubleBang = hooks && hooks.processShakeDoubleBang;
  const energyUI01 = clamp01(energyFromPhone);
  const lift = (typeof computeLift01 === "function") ? Number(computeLift01(groove, smooth, speed)) || 0 : 0;

  if (!skipPhysStatePatch && physState && typeof physState === "object") {
    physState.lift01 = lift;
    physState.dynamics01 = dynamics;
  }

  const shieldRgb01 = skipLegacyHudFields
    ? null
    : (frame && Array.isArray(frame.shieldRGB) && frame.shieldRGB.length >= 3)
    ? frame.shieldRGB
    : (d && Array.isArray(d.shieldRGB) && d.shieldRGB.length >= 3 ? d.shieldRGB : null);

  if (d && typeof d.sd === "string" && d.sd.trim()) {
    if (inputGestureSystem && typeof inputGestureSystem.setPendingDirection === "function") {
      inputGestureSystem.setPendingDirection(d.sd, nowMs);
    }
  }

  const stabilitySpeedMin01 = Number(inputDynamicsCfg.stability && inputDynamicsCfg.stability.speedMin01) || 0.02;
  const stabilityVisualGate =
    (!!physState && !physState.onGround) &&
    (clamp01(speed) >= stabilitySpeedMin01) &&
    (!!physState && !physState.shieldDescentBlocked);

  if (typeof setStabilityVisualGate === "function") {
    setStabilityVisualGate(stabilityVisualGate);
  }

  const dynStateBefore = (inputDynamicsSystem && typeof inputDynamicsSystem.getState === "function")
    ? (inputDynamicsSystem.getState() || { stabilityOn: false, variabilityOn: false })
    : { stabilityOn: false, variabilityOn: false };

  if (typeof applyStabilityVisuals === "function") {
    applyStabilityVisuals();
  }

  if (inputGestureSystem && typeof inputGestureSystem.processFlatSpinFrame === "function") {
    inputGestureSystem.processFlatSpinFrame({
      raw: d,
      atMs: nowMs,
      stabilityOn: !!dynStateBefore.stabilityOn,
      stabilityVisualGate,
    });
  }

  if (inputDynamicsSystem && typeof inputDynamicsSystem.processFrame === "function") {
    inputDynamicsSystem.processFrame({ dynamics01: dynamics, atMs: nowMs });
  }

  if (typeof applyStabilityVisuals === "function") {
    applyStabilityVisuals();
  }

  if (typeof processShakeDoubleBang === "function") {
    processShakeDoubleBang(shake, nowMs, groove);
  }

  return {
    nowMs,
    lift,
    groove,
    smooth,
    speed,
    dynamics,
    shake,
    locked,
    energyUI01,
    shieldRgb01,
  };
}
