function clamp01(n){
  n = Number(n);
  if (!isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

const FLOOR_CONTACT_EPSILON_PX = 0.25;
const CEIL_CONTACT_EPSILON_PX = 0.25;

/**
 * @typedef {Object} RunOrbRuntimePipelineOptions
 * @property {number} ts Frame timestamp (RAF time)
 * @property {number} dt Delta time in seconds (already clamped by caller)
 * @property {number} nowMs Receiver/performance clock time
 * @property {boolean} wasOnGround Previous frame grounded state
 * @property {Object} [physState] Legacy direct orb runtime motion state (mutated in place)
 * @property {{get?:() => Object}} [orbRuntimeState] Orb runtime state owner API (preferred)
 * @property {Object} phys Orb runtime physics config
 * @property {{vDownThr:number, graceMs:number}} shieldDescent Shield descent gate tuning
 * @property {Object} [mvp] Receiver MVP container (used for orb tick + impact application)
 * @property {Object} [orbFxSystem] Orb FX runtime system
 * @property {Object} [worldSystem] World runtime system
 * @property {Object} hooks Receiver-provided functions for math/helpers/render calls
 */

/**
 * Run one orb runtime simulation/render orchestration step.
 *
 * Mutates `physState` in place and invokes receiver-provided hooks for rendering and impact handling.
 * This function intentionally does not schedule RAF; the receiver owns frame scheduling.
 *
 * @param {RunOrbRuntimePipelineOptions} [options]
 * @returns {void}
 */
export function runOrbRuntimePipeline({
  ts,
  dt,
  nowMs,
  wasOnGround,
  physState,
  orbRuntimeState,
  phys,
  shieldDescent,
  mvp,
  orbFxSystem,
  worldSystem,
  hooks,
} = {}){
  const state = (orbRuntimeState && typeof orbRuntimeState.get === "function")
    ? orbRuntimeState.get()
    : physState;
  if (!state || !phys || !hooks) return;

  const clamp = typeof hooks.clamp === "function" ? hooks.clamp : ((n, a, b) => Math.min(b, Math.max(a, n)));
  const liftToThrustAccel = hooks.liftToThrustAccel;
  const isFloatGraceActive = hooks.isFloatGraceActive;
  const clearFloatGrace = hooks.clearFloatGrace;
  const groundCenterWorld = hooks.groundCenterWorld;
  const computeImpactMetric = hooks.computeImpactMetric;
  const drawStars = hooks.drawStars;
  const drawWorldBackdrop = hooks.drawWorldBackdrop;
  const updateOrbStrokeColor = hooks.updateOrbStrokeColor;
  const applyOrbTransform = hooks.applyOrbTransform;
  const updateDebugReadout = hooks.updateDebugReadout;

  if (mvp && mvp.orbSystem && typeof mvp.orbSystem.tick === "function") {
    mvp.orbSystem.tick(nowMs);
  }

  const g = phys.gBase * state.gravityMul;
  const thrust = (typeof liftToThrustAccel === "function")
    ? Number(liftToThrustAccel(state.lift01)) || 0
    : (Number(phys.thrustMax) || 0) * clamp01(state.lift01);

  let a = g - thrust;

  const signedFallDrag = clamp(Number(phys.downDrag) || 0, -1, 1);
  const drag = (state.v >= 0) ? signedFallDrag : phys.upDrag;
  a += (-drag * state.v);

  state.v += a * dt;
  state.v = clamp(state.v, -phys.maxUpSpeed, phys.maxDownSpeed);
  state.yW += state.v * dt;

  if (typeof isFloatGraceActive === "function" && isFloatGraceActive(nowMs)) {
    const upwardIntent = (thrust > (g + 180)) || (state.v < -22);
    if (upwardIntent) {
      if (typeof clearFloatGrace === "function") clearFloatGrace();
    } else {
      const dragFactor = Math.max(0, -Number(phys.downDrag) || 0);
      const bobAmp = clamp(1.8 + (state.gravityMul * 1.2) + (dragFactor * 1.8), 1.8, 6.0);
      const bobHz = clamp(0.8 + (state.gravityMul * 0.25) + (dragFactor * 0.15), 0.8, 1.7);
      state.floatGracePhase += (Math.PI * 2 * bobHz * dt);
      const targetY = state.floatGraceAnchorY + (Math.sin(state.floatGracePhase) * bobAmp);

      const holdHz = clamp(8 + (state.gravityMul * 3) + (dragFactor * 2), 8, 18);
      const alpha = 1 - Math.exp(-holdHz * dt);
      state.yW += (targetY - state.yW) * alpha;
      state.v = 0;
    }
  }

  const dtMs = dt * 1000;
  if (state.v > shieldDescent.vDownThr) {
    state.descendMs = Math.min(shieldDescent.graceMs * 2, state.descendMs + dtMs);
  } else {
    state.descendMs = 0;
  }
  state.shieldDescentBlocked = (state.descendMs >= shieldDescent.graceMs);

  const yFloor = (typeof groundCenterWorld === "function") ? Number(groundCenterWorld()) || 0 : 0;
  const yCeil  = Number(phys.orbRadiusPx) || 0;
  let impactMag = 0;
  let impactSrc = "";
  const vyPreClamp = state.v;
  const wasAtCeil = (state.yW <= (yCeil + CEIL_CONTACT_EPSILON_PX));

  state.onGround = false;

  if (state.yW >= (yFloor - FLOOR_CONTACT_EPSILON_PX)) {
    if (!wasOnGround && vyPreClamp > 0) {
      impactMag = Math.max(impactMag, Math.abs(vyPreClamp));
      impactSrc = "ground";
    }
    state.yW = yFloor;
    if (state.v > 0) state.v = 0;
    state.onGround = true;
  }

  if (state.yW <= (yCeil + CEIL_CONTACT_EPSILON_PX)) {
    if (!wasAtCeil && vyPreClamp < 0) {
      impactMag = Math.max(impactMag, Math.abs(vyPreClamp));
      impactSrc = impactSrc || "ceiling";
    }
    state.yW = yCeil;
    if (state.v < 0) state.v = -state.v * phys.bounce;
  }

  if (mvp && impactMag > 0 && typeof computeImpactMetric === "function" && typeof mvp.applyImpact === "function") {
    const impactMetric = computeImpactMetric(impactMag);
    mvp.applyImpact(impactMetric, impactSrc || "boundary", {
      rawImpact: impactMag,
      gravityMul: state.gravityMul,
      fallDrag: phys.downDrag,
    });
  }

  if (typeof drawStars === "function") drawStars();
  if (typeof drawWorldBackdrop === "function") drawWorldBackdrop();
  if (typeof updateOrbStrokeColor === "function") updateOrbStrokeColor(dt);
  if (typeof applyOrbTransform === "function") applyOrbTransform();
  if (orbFxSystem && typeof orbFxSystem.tick === "function") orbFxSystem.tick(ts, dt);
  if (worldSystem && typeof worldSystem.tick === "function") worldSystem.tick(ts, dt);
  if (typeof updateDebugReadout === "function") updateDebugReadout();
}
