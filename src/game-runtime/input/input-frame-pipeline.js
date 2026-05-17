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
 * @property {number} [nowMs]
 * @property {{groove?:number, dynamics?:number, motionTrust?:number, fallCatch?:number, smooth?:number, speed?:number, shake?:number}} [values]
 * @property {{inputGestureSystem?:Object, inputDynamicsSystem?:Object}} [systems]
 * @property {{physState?:Object, orbRuntimeState?:{get?:() => Object}}} [runtime]
 * @property {{inputDynamics?:Object}} [configs]
 * @property {Object} [hooks] Receiver-provided hooks for gesture/stability side effects.
 * @property {boolean} [skipPhysStatePatch] When true, do not mutate orb runtime scalar state.
 */

/**
 * Run the receiver input-frame orchestration in the correct order (behavior-preserving extraction).
 *
 * Side effects are performed via injected hooks/systems.
 *
 * @param {RunInputFramePipelineOptions} [options]
 * @returns {void}
 */
export function runInputFramePipeline({
  d,
  nowMs,
  values,
  systems,
  runtime,
  configs,
  hooks,
  skipPhysStatePatch = false,
} = {}){
  const groove = Number(values && values.groove) || 0;
  const dynamics = Number(values && values.dynamics) || 0;
  const motionTrust = Number(values && values.motionTrust) || 0;
  const fallCatch = Number(values && values.fallCatch) || 0;
  const smooth = Number(values && values.smooth) || 0;
  const speed = Number(values && values.speed) || 0;
  const shake = Number(values && values.shake) || 0;

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
  const lift = (typeof computeLift01 === "function") ? Number(computeLift01(groove, smooth, speed)) || 0 : 0;

  if (!skipPhysStatePatch && physState && typeof physState === "object") {
    physState.lift01 = lift;
    physState.dynamics01 = dynamics;
    physState.motionTrust01 = motionTrust;
    physState.fallCatch01 = fallCatch;
  }

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

  if (inputGestureSystem && typeof inputGestureSystem.processSmoothGateFrame === "function") {
    inputGestureSystem.processSmoothGateFrame({ smooth01: smooth, atMs: nowMs });
  }

  if (typeof applyStabilityVisuals === "function") {
    applyStabilityVisuals();
  }

  if (typeof processShakeDoubleBang === "function") {
    processShakeDoubleBang(shake, nowMs, lift);
  }
}
