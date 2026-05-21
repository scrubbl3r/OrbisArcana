import { stepOrbLateralMotion } from "./orb-lateral-motion.js?v=20260420t";
import { resolveCircleVsBoundarySegments } from "../collision/circle-boundary-collision.js?v=20260423g";
import { resolveSphereVsExtrudedBoundarySegments } from "../collision/sphere-cavity-collision.js?v=20260428c";

const SPAWN_DRIFT_START_PHASE_RAD = Math.PI;

function clamp01(n){
  n = Number(n);
  if (!isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

const SPHERE_COLLISION_SCRATCH = {
  contacts: [],
  hits: [],
  hitPool: [],
  response: {
    normalX: 0,
    normalY: -1,
    depth: 0,
    grounded: false,
    strongest: null,
  },
};
const CONTACT_NORMAL_SCRATCH = { x: 0, y: 0 };
const CONTACT_VELOCITY_NORMAL_SCRATCH = { x: 0, y: 0 };

function aggregateContactNormal(contacts = [], target = CONTACT_NORMAL_SCRATCH) {
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  let sumX = 0;
  let sumY = 0;
  let strongest = null;
  for (const contact of safeContacts) {
    if (!contact) continue;
    const depth = Math.max(0, Number(contact.depth) || 0);
    const nx = Number(contact.normalX) || 0;
    const ny = Number(contact.normalY) || 0;
    sumX += nx * depth;
    sumY += ny * depth;
    if (!strongest || depth > (Number(strongest.depth) || 0)) strongest = contact;
  }
  const length = Math.hypot(sumX, sumY);
  if (length > 0.000001) {
    target.x = sumX / length;
    target.y = sumY / length;
    return target;
  }
  if (strongest) {
    target.x = Number(strongest.normalX) || 0;
    target.y = Number(strongest.normalY) || -1;
    return target;
  }
  return null;
}

function resolveVelocityContactNormal(contactNormal, segmentCollision) {
  if (!contactNormal) return null;
  const nx = Number(contactNormal.x) || 0;
  const ny = Number(contactNormal.y) || 0;
  const wallLike = !segmentCollision?.grounded
    && Math.abs(nx) >= 0.72
    && Math.abs(ny) <= 0.46;
  if (!wallLike) return contactNormal;
  CONTACT_VELOCITY_NORMAL_SCRATCH.x = nx < 0 ? -1 : 1;
  CONTACT_VELOCITY_NORMAL_SCRATCH.y = 0;
  return CONTACT_VELOCITY_NORMAL_SCRATCH;
}

const FLOOR_CONTACT_EPSILON_PX = 0.25;
const CEIL_CONTACT_EPSILON_PX = 0.25;

function resolveOrbFallDrag({
  baseDownDrag,
  fallCatch01,
  orbControl,
  clamp,
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : ((n, a, b) => Math.min(b, Math.max(a, n)));
  const configuredBase = Number(orbControl && orbControl.fallDragBase);
  const base = safeClamp(Number.isFinite(configuredBase) ? configuredBase : (Number(baseDownDrag) || 0), -5, 1);
  const configuredTarget = Number(orbControl && orbControl.flatSpinFallDrag);
  const target = safeClamp(Number.isFinite(configuredTarget) ? configuredTarget : base, -5, 1);
  const configuredCurve = Number(orbControl && orbControl.flatSpinFallDragCurve);
  const curve = Math.max(0.05, Number.isFinite(configuredCurve) ? configuredCurve : 1);
  const t = Math.pow(clamp01(fallCatch01), curve);
  return base + ((target - base) * t);
}

function resolveDynamicLiftBoost({
  dynamics01,
  orbControl,
  clamp,
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : ((n, a, b) => Math.min(b, Math.max(a, n)));
  const configuredStart = Number(orbControl && orbControl.dynamicLiftBoostStart01);
  const start = safeClamp(Number.isFinite(configuredStart) ? configuredStart : 0, 0, 0.99);
  const configuredMax = Number(orbControl && orbControl.dynamicLiftBoostMax);
  const max = safeClamp(Number.isFinite(configuredMax) ? configuredMax : 1, 0, 4);
  const configuredCurve = Number(orbControl && orbControl.dynamicLiftBoostCurve);
  const curve = Math.max(0.05, Number.isFinite(configuredCurve) ? configuredCurve : 1);
  const span = Math.max(1e-6, 1 - start);
  const t = Math.pow(clamp01((clamp01(dynamics01) - start) / span), curve);
  return 1 + ((max - 1) * t);
}

/**
 * @typedef {Object} RunOrbRuntimePipelineOptions
 * @property {number} ts Frame timestamp (RAF time)
 * @property {number} dt Delta time in seconds (already clamped by caller)
 * @property {number} nowMs Receiver/performance clock time
 * @property {boolean} wasOnGround Previous frame grounded state
 * @property {Object} [physState] Legacy direct orb runtime motion state (mutated in place)
 * @property {{get?:() => Object}} [orbRuntimeState] Orb runtime state owner API (preferred)
 * @property {Object} phys Orb runtime physics config
 * @property {{fallDragBase?:number, flatSpinFallDrag?:number, flatSpinFallDragCurve?:number, dynamicLiftBoostStart01?:number, dynamicLiftBoostMax?:number, dynamicLiftBoostCurve?:number}} [orbControl] Orb-specific input control tuning
 * @property {{vDownThr:number, graceMs:number}} shieldDescent Shield descent gate tuning
 * @property {Object} [receiverRuntime] Receiver runtime container (used for orb tick + impact application)
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
  orbControl,
  shieldDescent,
  receiverRuntime,
  orbFxSystem,
  worldSystem,
  hooks,
} = {}){
  const runtime = receiverRuntime || null;
  const state = (orbRuntimeState && typeof orbRuntimeState.get === "function")
    ? orbRuntimeState.get()
    : physState;
  if (!state || !phys || !hooks) return;

  const clamp = typeof hooks.clamp === "function" ? hooks.clamp : ((n, a, b) => Math.min(b, Math.max(a, n)));
  const liftToThrustAccel = hooks.liftToThrustAccel;
  const isFloatGraceActive = hooks.isFloatGraceActive;
  const clearFloatGrace = hooks.clearFloatGrace;
  const groundCenterWorld = hooks.groundCenterWorld;
  const getCeilingWorld = hooks.getCeilingWorld;
  const computeImpactMetric = hooks.computeImpactMetric;
  const updateOrbStrokeColor = hooks.updateOrbStrokeColor;
  const applyOrbTransform = hooks.applyOrbTransform;
  const updateDebugReadout = hooks.updateDebugReadout;
  const getLateralBounds = hooks.getLateralBounds;
  const getCameraSteeringState = hooks.getCameraSteeringState;
  const getBoundarySegments = hooks.getBoundarySegments;
  const getCavityCollisionConfig = hooks.getCavityCollisionConfig;
  const getSpawnHoldConfig = hooks.getSpawnHoldConfig;
  const traceMeasure = typeof hooks.traceMeasure === "function"
    ? hooks.traceMeasure
    : (_name, fn) => (typeof fn === "function" ? fn() : undefined);

  if (runtime && runtime.orbSystem && typeof runtime.orbSystem.tick === "function") {
    traceMeasure("receiverRuntime.orbSystem", () => runtime.orbSystem.tick(nowMs));
  }

  if (state.spawnHoldActive) {
    const spawnConfig = typeof getSpawnHoldConfig === "function" ? (getSpawnHoldConfig() || {}) : {};
    const releaseThreshold = clamp01(
      Number.isFinite(Number(spawnConfig.liftReleaseThreshold01))
        ? Number(spawnConfig.liftReleaseThreshold01)
        : 0.15
    );
    if (clamp01(state.lift01) >= releaseThreshold) {
      state.spawnHoldActive = false;
      state.v = 0;
      state.vx = 0;
      state.steerIntentX = 0;
      state.steerActive = false;
    } else {
      const bo = Math.max(1, (Number(phys.orbRadiusPx) || 0) * 2);
      const anchorX = Number.isFinite(Number(state.spawnHoldAnchorX))
        ? Number(state.spawnHoldAnchorX)
        : Number(state.xW || 0);
      const anchorY = Number.isFinite(Number(state.spawnHoldAnchorY))
        ? Number(state.spawnHoldAnchorY)
        : Number(state.yW || 0);
      const startedAtMs = Number.isFinite(Number(state.spawnHoldStartedAtMs))
        ? Number(state.spawnHoldStartedAtMs)
        : Number(nowMs || 0);
      const t = Math.max(0, (Number(nowMs || 0) - startedAtMs) / 1000);
      const driftRange = Math.max(0, Number(spawnConfig.driftRangeBO) || 0) * bo;
      const driftHz = Math.max(0, Number(spawnConfig.driftSpeedHz) || 0);
      const bobRange = Math.max(0, Number(spawnConfig.bobRangeBO) || 0) * bo;
      const bobHz = Math.max(0, Number(spawnConfig.bobSpeedHz) || 0);
      const targetX = anchorX + (Math.sin((t * Math.PI * 2 * driftHz) + SPAWN_DRIFT_START_PHASE_RAD) * driftRange);
      const targetY = anchorY + (Math.sin(t * Math.PI * 2 * bobHz) * bobRange);
      const holdHz = Math.max(1, Number(spawnConfig.holdEaseHz) || 12);
      const alpha = 1 - Math.exp(-holdHz * dt);
      state.xW += (targetX - state.xW) * alpha;
      state.yW += (targetY - state.yW) * alpha;
      state.v = 0;
      state.vx = 0;
      state.steerIntentX = 0;
      state.steerActive = false;
      state.onGround = false;
      state.descendMs = 0;
      state.shieldDescentBlocked = false;

      if (typeof updateOrbStrokeColor === "function") updateOrbStrokeColor(dt);
      if (typeof applyOrbTransform === "function") applyOrbTransform();
      if (orbFxSystem && typeof orbFxSystem.tick === "function") traceMeasure("orbFx.tick", () => orbFxSystem.tick(ts, dt));
      if (worldSystem && typeof worldSystem.tick === "function") traceMeasure("world.tick", () => worldSystem.tick(ts, dt));
      if (typeof updateDebugReadout === "function") updateDebugReadout();
      return;
    }
  }

  if (state.teleportHoldActive) {
    const yFloor = (typeof groundCenterWorld === "function") ? Number(groundCenterWorld()) || 0 : 0;
    const yCeil  = (typeof getCeilingWorld === "function")
      ? Number(getCeilingWorld()) || 0
      : (Number(phys.orbRadiusPx) || 0);
    const holdY = Number.isFinite(Number(state.teleportHoldAnchorY))
      ? Number(state.teleportHoldAnchorY)
      : Number(state.yW || yFloor);
    state.yW = clamp(holdY, yCeil, yFloor);
    state.v = 0;
    state.vx = 0;
    state.steerIntentX = 0;
    state.steerActive = false;
    state.onGround = false;
    state.descendMs = 0;
    state.shieldDescentBlocked = false;

    if (typeof updateOrbStrokeColor === "function") updateOrbStrokeColor(dt);
    if (typeof applyOrbTransform === "function") applyOrbTransform();
    if (orbFxSystem && typeof orbFxSystem.tick === "function") traceMeasure("orbFx.tick", () => orbFxSystem.tick(ts, dt));
    if (worldSystem && typeof worldSystem.tick === "function") traceMeasure("world.tick", () => worldSystem.tick(ts, dt));
    if (typeof updateDebugReadout === "function") updateDebugReadout();
    return;
  }

  const graceActive = typeof isFloatGraceActive === "function"
    ? isFloatGraceActive(nowMs)
    : !!(state.floatGraceActive && (
        state.floatGracePersistent || Number(state.floatGraceUntilMs || 0) > Number(nowMs || 0)
      ));
  const graceSuppressInput = graceActive && !!state.floatGraceSuppressInput;
  const graceBreakOnLift = state.floatGraceBreakOnLift !== false;
  const graceBreakOnMotion = state.floatGraceBreakOnMotion !== false;

  if (graceSuppressInput) {
    const yFloor = (typeof groundCenterWorld === "function") ? Number(groundCenterWorld()) || 0 : 0;
    const yCeil = (typeof getCeilingWorld === "function")
      ? Number(getCeilingWorld()) || 0
      : (Number(phys.orbRadiusPx) || 0);
    const anchorY = Number.isFinite(Number(state.floatGraceAnchorY)) ? Number(state.floatGraceAnchorY) : Number(state.yW || yFloor);
    const dragFactor = Math.max(0, -Number(phys.downDrag) || 0);
    const bobAmp = clamp(1.8 + (state.gravityMul * 1.2) + (dragFactor * 1.8), 1.8, 6.0);
    const bobHz = clamp(0.8 + (state.gravityMul * 0.25) + (dragFactor * 0.15), 0.8, 1.7);
    state.floatGracePhase += (Math.PI * 2 * bobHz * dt);
    const targetY = anchorY + (Math.sin(state.floatGracePhase) * bobAmp);
    const holdHz = clamp(8 + (state.gravityMul * 3) + (dragFactor * 2), 8, 18);
    const alpha = 1 - Math.exp(-holdHz * dt);
    state.yW += (clamp(targetY, yCeil, yFloor) - state.yW) * alpha;
    state.v = 0;
    state.vx = 0;
    state.lift01 = 0;
    state.steerIntentX = 0;
    state.steerActive = false;
    state.onGround = false;
    state.descendMs = 0;
    state.shieldDescentBlocked = false;

    if (typeof updateOrbStrokeColor === "function") updateOrbStrokeColor(dt);
    if (typeof applyOrbTransform === "function") applyOrbTransform();
    if (orbFxSystem && typeof orbFxSystem.tick === "function") traceMeasure("orbFx.tick", () => orbFxSystem.tick(ts, dt));
    if (worldSystem && typeof worldSystem.tick === "function") traceMeasure("world.tick", () => worldSystem.tick(ts, dt));
    if (typeof updateDebugReadout === "function") updateDebugReadout();
    return;
  }

  if (!graceSuppressInput) {
    stepOrbLateralMotion({
      dt,
      state,
      steering: typeof getCameraSteeringState === "function" ? getCameraSteeringState() : null,
      bounds: typeof getLateralBounds === "function" ? getLateralBounds() : null,
    });
  }

  const g = phys.gBase * state.gravityMul;
  const baseThrust = graceSuppressInput
    ? 0
    : (typeof liftToThrustAccel === "function")
    ? Number(liftToThrustAccel(state.lift01)) || 0
    : (Number(phys.thrustMax) || 0) * clamp01(state.lift01);
  const dynamicLiftBoost = resolveDynamicLiftBoost({
    dynamics01: state.dynamics01,
    orbControl,
    clamp,
  });
  const thrust = baseThrust * dynamicLiftBoost;

  let a = g - thrust;

  const signedFallDrag = resolveOrbFallDrag({
    baseDownDrag: phys.downDrag,
    fallCatch01: state.fallCatch01,
    orbControl,
    clamp,
  });
  const drag = (state.v >= 0) ? signedFallDrag : phys.upDrag;
  a += (-drag * state.v);

  state.v += a * dt;
  state.v = clamp(state.v, -phys.maxUpSpeed, phys.maxDownSpeed);
  state.yW += state.v * dt;

  if (graceActive) {
    const upwardIntent = (thrust > (g + 180)) || (state.v < -22);
    if (graceBreakOnLift && upwardIntent && !graceSuppressInput) {
      if (typeof clearFloatGrace === "function") clearFloatGrace();
    } else {
      const dragFactor = Math.max(0, -Number(signedFallDrag) || 0);
      const bobAmp = clamp(1.8 + (state.gravityMul * 1.2) + (dragFactor * 1.8), 1.8, 6.0);
      const bobHz = clamp(0.8 + (state.gravityMul * 0.25) + (dragFactor * 0.15), 0.8, 1.7);
      state.floatGracePhase += (Math.PI * 2 * bobHz * dt);
      const targetY = state.floatGraceAnchorY + (Math.sin(state.floatGracePhase) * bobAmp);

      const holdHz = clamp(8 + (state.gravityMul * 3) + (dragFactor * 2), 8, 18);
      const alpha = 1 - Math.exp(-holdHz * dt);
      state.yW += (targetY - state.yW) * alpha;
      state.v = 0;
      if (graceSuppressInput) {
        state.vx = 0;
        state.lift01 = 0;
        state.steerIntentX = 0;
        state.steerActive = false;
      }
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
  const yCeil  = (typeof getCeilingWorld === "function")
    ? Number(getCeilingWorld()) || 0
    : (Number(phys.orbRadiusPx) || 0);
  let impactMag = 0;
  let impactSrc = "";
  const vyPreClamp = state.v;
  const wasAtCeil = (state.yW <= (yCeil + CEIL_CONTACT_EPSILON_PX));
  const preBoundaryXW = Number(state.xW) || 0;
  const preBoundaryYW = Number(state.yW) || 0;
  const preBoundaryVX = Number(state.vx) || 0;
  const preBoundaryVY = Number(state.v) || 0;
  const cavityCollisionConfig = typeof getCavityCollisionConfig === "function"
    ? getCavityCollisionConfig()
    : null;
  const cavitySegments = Array.isArray(cavityCollisionConfig && cavityCollisionConfig.segments)
    ? cavityCollisionConfig.segments
    : [];
  const segmentCollision = cavitySegments.length
    ? resolveSphereVsExtrudedBoundarySegments({
      sphereXW: preBoundaryXW,
      sphereYW: preBoundaryYW,
      sphereZBO: Number(cavityCollisionConfig && cavityCollisionConfig.orbZBO) || 0,
      radiusW: Number(phys.orbRadiusPx) || 0,
      segments: cavitySegments,
      depthBO: Number(cavityCollisionConfig && cavityCollisionConfig.maxDepthBO) || 0,
      boWorldUnits: Math.max(1, (Number(phys.orbRadiusPx) || 0) * 2),
      previousXW: preBoundaryXW - (preBoundaryVX * dt),
      previousYW: preBoundaryYW - (preBoundaryVY * dt),
      maxIterations: 3,
      target: SPHERE_COLLISION_SCRATCH,
    })
    : resolveCircleVsBoundarySegments({
      circleXW: preBoundaryXW,
      circleYW: preBoundaryYW,
      radiusW: Number(phys.orbRadiusPx) || 0,
      segments: typeof getBoundarySegments === "function" ? getBoundarySegments() : [],
      previousXW: preBoundaryXW - (preBoundaryVX * dt),
      previousYW: preBoundaryYW - (preBoundaryVY * dt),
      maxIterations: 3,
    });
  if (segmentCollision && segmentCollision.maxDepth > 0) {
    state.xW = Number(segmentCollision.xW) || state.xW;
    state.yW = Number(segmentCollision.yW) || state.yW;
    const contactNormal = aggregateContactNormal(segmentCollision.contacts);
    const velocityNormal = resolveVelocityContactNormal(contactNormal, segmentCollision);
    if (velocityNormal) {
      const inwardVelocity = (Number(state.vx) || 0) * velocityNormal.x + (Number(state.v) || 0) * velocityNormal.y;
      if (inwardVelocity < 0) {
        state.vx -= inwardVelocity * velocityNormal.x;
        state.v -= inwardVelocity * velocityNormal.y;
      }
    }
    if (segmentCollision.grounded) {
      state.onGround = true;
    }
  }

  state.onGround = !!(segmentCollision && segmentCollision.grounded);

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

  if (runtime && impactMag > 0 && typeof computeImpactMetric === "function" && typeof runtime.applyImpact === "function") {
    const impactMetric = computeImpactMetric(impactMag);
    runtime.applyImpact(impactMetric, impactSrc || "boundary", {
      rawImpact: impactMag,
      gravityMul: state.gravityMul,
      fallDrag: signedFallDrag,
    });
  }

  if (typeof updateOrbStrokeColor === "function") updateOrbStrokeColor(dt);
  if (typeof applyOrbTransform === "function") applyOrbTransform();
  if (orbFxSystem && typeof orbFxSystem.tick === "function") traceMeasure("orbFx.tick", () => orbFxSystem.tick(ts, dt));
  if (worldSystem && typeof worldSystem.tick === "function") traceMeasure("world.tick", () => worldSystem.tick(ts, dt));
  if (typeof updateDebugReadout === "function") updateDebugReadout();
}
