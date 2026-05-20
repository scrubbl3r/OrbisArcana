import * as THREE from "three";
import {
  COMBAT_EFFECT_DAMAGE,
  COMBAT_EFFECT_MOTION_MODIFIER,
  COMBAT_EFFECT_STUN,
  COMBAT_ENTITY_ORB,
  DAMAGE_TYPE_FIRE,
  DAMAGE_TYPE_LEECH,
} from "../combat/combat-constants.js";
import { normalizeStunEffect, resolveStunApplication } from "../combat/stun-model.js";
import {
  applyBurningStatusToEntity,
  getBurningVisualState,
  normalizeBurningStatus,
  STATUS_EFFECT_BURNING,
  tickBurningStatusOnEntity,
} from "../status/fire/burning-status-model.js";
import { createFireCardSystem } from "../vfx/fire/fire-card-system.js?v=20260520f";

const GNAT_COMBAT_EMIT_INTERVAL_MS = 100;
const GNAT_LIFT_MODIFIER_DURATION_MS = 180;
const GNAT_SIGNAL_FLASH_SEC = 1;
const GNAT_SIGNAL_BLINK_PERIOD_SEC = 0.2;
const GNAT_SIGNAL_BLINK_GAP_SEC = 0.05;
const GNAT_STUN_BOUNCE_ANGLE_RAD = THREE.MathUtils.degToRad(10);
const GNAT_COLOR_NEUTRAL = new THREE.Color(0x9dff8a);
const GNAT_COLOR_ALERTED = new THREE.Color(0xff4b4b);
const GNAT_COLOR_SIGNAL = new THREE.Color(0xffe45e);
const GNAT_COLOR_BURNING = new THREE.Color(0xff7a18);
const GNAT_COLOR_DEAD = new THREE.Color(0x777777);
const GNAT_COLOR_FIRE_CORE = new THREE.Color(0xfff0a0);
const GNAT_DEATH_FADE_SEC = 0.25;
const GNAT_DEATH_LINGER_RANGE_SEC = Object.freeze([5, 8]);
const GNAT_BURN_AFTER_GROUND_RANGE_SEC = Object.freeze([1.5, 3]);
const GNAT_BURN_HIDE_BUFFER_SEC = 0.35;
const ZERO_SCALE_VEC = new THREE.Vector3(0, 0, 0);
const GNAT_COLOR_TMP = new THREE.Color();
const GNAT_COLOR_FIRE_TMP = new THREE.Color();

function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function rangePair(range = [], fallback = [0, 1]) {
  const numeric = Number(range);
  if (Number.isFinite(numeric)) return [numeric, numeric];
  if (!Array.isArray(range) || range.length < 2) return fallback.slice();
  const min = Number(range[0]);
  const max = Number(range[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback.slice();
  return min <= max ? [min, max] : [max, min];
}

function randomInRange(range = [], fallback = 1) {
  const [min, max] = rangePair(range, [fallback, fallback]);
  return min + Math.random() * Math.max(0, max - min);
}

function scalarSetting(value, fallback = 0) {
  if (Array.isArray(value)) {
    const numbers = value.map(Number).filter(Number.isFinite);
    if (numbers.length) return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function curveUnitValue(t = 0, curve = null) {
  const linear = Math.min(1, Math.max(0, Number(t) || 0));
  const scalar = Number(curve);
  const bias = Number.isFinite(scalar) ? clampNumber(scalar, 0, -1, 1) : clampNumber(curve && curve.bias, 0, -1, 1);
  const amount = Number.isFinite(scalar) ? Math.abs(bias) : clampNumber(curve && curve.amount, 0, 0, 1);
  if (Math.abs(bias) <= 0.0001 || amount <= 0.0001) return linear;
  const power = 1 + Math.abs(bias) * 4;
  const curved = bias < 0
    ? linear ** power
    : 1 - (1 - linear) ** power;
  return linear + (curved - linear) * amount;
}

function randomInRangeWithCurve(range = [], fallback = 1, curve = null) {
  const [min, max] = rangePair(range, [fallback, fallback]);
  return min + curveUnitValue(Math.random(), curve) * Math.max(0, max - min);
}

function randomUnit() {
  return Math.random() * 2 - 1;
}

function distance(a, b) {
  return Math.hypot((a.xW || 0) - (b.xW || 0), (a.yW || 0) - (b.yW || 0));
}

function normalizeUnit(value, fallback = 0) {
  return clampNumber(value, fallback, 0, 1);
}

function tintEmissiveWithInstanceColor(material = null) {
  if (!material) return;
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= diffuseColor.rgb;"
    );
  };
  material.customProgramCacheKey = () => "gnat-instance-emissive-tint";
}

function shouldShowSignalBlink(state = null, nowSec = 0) {
  if (!state || nowSec >= (state.signalFlashUntil || 0)) return false;
  const remainingSec = Math.max(0, state.signalFlashUntil - nowSec);
  const elapsedSec = Math.max(0, GNAT_SIGNAL_FLASH_SEC - remainingSec);
  return (elapsedSec % GNAT_SIGNAL_BLINK_PERIOD_SEC) < (GNAT_SIGNAL_BLINK_PERIOD_SEC - GNAT_SIGNAL_BLINK_GAP_SEC);
}

function resolveBurningRuntimeState(state = null, nowSec = 0) {
  if (!state) return Object.freeze({ active: false, profile: null, intensity: 0 });
  const burningVisual = getBurningVisualState(state, nowSec);
  const visualUntilSec = Number(state.burnVisualUntilSec) || 0;
  const deathFalling = !!state.burnDeathActive && !state.burnGroundedSec;
  const deathAfterburn = !!state.burnDeathActive && visualUntilSec > nowSec;
  const active = !!burningVisual.active || deathFalling || deathAfterburn;
  return Object.freeze({
    active,
    profile: burningVisual.profile,
    intensity: active ? Math.max(0.35, Number(burningVisual.intensity) || Number(state.burnVisualIntensity) || 1) : 0,
  });
}

function syncBurnVisualFromStatus(state = null, nowSec = 0) {
  const burning = state && state.statusEffects && state.statusEffects[STATUS_EFFECT_BURNING];
  if (!state || !burning || typeof burning !== "object") return false;
  const untilSec = Math.max(Number(burning.burnUntilSec) || 0, Number(burning.roastUntilSec) || 0);
  if (untilSec > nowSec) state.burnVisualUntilSec = Math.max(Number(state.burnVisualUntilSec) || 0, untilSec);
  state.burnVisualIntensity = Math.max(Number(state.burnVisualIntensity) || 0, Number(burning.intensity) || 1);
  return untilSec > nowSec;
}

function readSearchParam(name) {
  try {
    const params = new URLSearchParams(globalThis.location && globalThis.location.search || "");
    if (!params.has(name)) return null;
    const value = params.get(name);
    return String(value == null ? "" : value).trim().toLowerCase();
  } catch (_) {
    return null;
  }
}

function readBurnVisualDiagnostics() {
  const cardMode = readSearchParam("gnatBurnCardMode") || "";
  const bodyMode = readSearchParam("gnatBurnBody") || "";
  return Object.freeze({
    cardMode,
    bodyMode,
    solidCards: cardMode === "solid" || cardMode === "white",
    hideCards: cardMode === "off" || cardMode === "hide",
    disableBody: bodyMode === "off" || bodyMode === "hide" || bodyMode === "0",
  });
}

function shapedProximityChance({ distancePx = 0, radiusPx = 1, baseChance = 0, awareness = 1, strength = 1 } = {}) {
  if (radiusPx <= 0 || distancePx > radiusPx) return 0;
  const proximity = 1 - distancePx / radiusPx;
  return normalizeUnit(baseChance * awareness * strength * proximity * proximity, 0);
}

function normalFromPoints(from = {}, to = {}, fallbackAngle = 0) {
  const dx = (to.xW || 0) - (from.xW || 0);
  const dy = (to.yW || 0) - (from.yW || 0);
  const length = Math.hypot(dx, dy);
  if (length > 0.000001) return { xW: dx / length, yW: dy / length };
  return { xW: Math.cos(fallbackAngle), yW: Math.sin(fallbackAngle) };
}

function pointInLoop(point = {}, loop = null) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  if (points.length < 3) return false;
  let inside = false;
  const x = clampNumber(point.xW, 0);
  const y = clampNumber(point.yW, 0);
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const pi = points[i] || {};
    const pj = points[j] || {};
    const xi = clampNumber(pi.xW, 0);
    const yi = clampNumber(pi.yW, 0);
    const xj = clampNumber(pj.xW, 0);
    const yj = clampNumber(pj.yW, 0);
    const denom = Math.abs(yj - yi) > 0.000001 ? (yj - yi) : 0.000001;
    const intersects = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / denom + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInBounds(point = {}, loops = []) {
  const usableLoops = Array.isArray(loops) ? loops : [];
  if (!usableLoops.length) return true;
  return usableLoops.some((loop) => pointInLoop(point, loop));
}

function clampToBox(point = {}, box = null) {
  if (!box) return { xW: clampNumber(point.xW, 0), yW: clampNumber(point.yW, 0) };
  return {
    xW: clampNumber(point.xW, 0, box.leftXW, box.rightXW),
    yW: clampNumber(point.yW, 0, box.topYW, box.bottomYW),
  };
}

function copyPoint(point = {}) {
  return {
    xW: clampNumber(point.xW, 0),
    yW: clampNumber(point.yW, 0),
  };
}

function physicsPointInBounds(point = {}, bounds = {}) {
  const box = bounds && bounds.box;
  if (box) {
    const x = Number(point.xW);
    const y = Number(point.yW);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    if (x < box.leftXW || x > box.rightXW || y < box.topYW || y > box.bottomYW) return false;
  }
  return pointInBounds(point, bounds && bounds.loops);
}

function randomPointAround(center = {}, radius = 1, minRadius = 0, curve = null) {
  const angle = Math.random() * Math.PI * 2;
  const outer = Math.max(0, radius);
  const inner = Math.min(outer, Math.max(0, minRadius));
  const shaped = curveUnitValue(Math.random(), curve);
  const r = Math.sqrt(inner * inner + shaped * Math.max(0, outer * outer - inner * inner));
  return {
    xW: clampNumber(center.xW, 0) + Math.cos(angle) * r,
    yW: clampNumber(center.yW, 0) + Math.sin(angle) * r,
  };
}

function resolveBoundedPoint(point = {}, {
  fallback = null,
  loops = [],
  box = null,
  nav = null,
} = {}) {
  if (nav && typeof nav.resolvePoint === "function") {
    return nav.resolvePoint(point, { fallback });
  }
  const clamped = clampToBox(point, box);
  if (pointInBounds(clamped, loops)) return clamped;
  return fallback ? clampToBox(fallback, box) : clamped;
}

function boundedPointContains(point = {}, bounds = {}) {
  if (bounds && bounds.nav && typeof bounds.nav.containsPoint === "function") {
    return bounds.nav.containsPoint(point);
  }
  return pointInBounds(point, bounds.loops);
}

function randomBoundedPointAround(center = {}, radius = 1, bounds = {}, minRadius = 0, curve = null) {
  if (bounds && bounds.nav && typeof bounds.nav.randomPointAround === "function") {
    return bounds.nav.randomPointAround(center, radius, { minRadius, curve });
  }
  for (let i = 0; i < 24; i += 1) {
    const candidate = clampToBox(randomPointAround(center, radius, minRadius, curve), bounds.box);
    if (pointInBounds(candidate, bounds.loops)) return candidate;
  }
  return resolveBoundedPoint(center, { fallback: center, loops: bounds.loops, box: bounds.box });
}

function segmentInBounds(from = {}, to = {}, bounds = {}, stepPx = 80) {
  if (bounds && bounds.nav && typeof bounds.nav.segmentIsWalkable === "function") {
    return bounds.nav.segmentIsWalkable(from, to, stepPx);
  }
  const total = distance(from, to);
  const steps = Math.max(1, Math.ceil(total / Math.max(1, stepPx)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = {
      xW: (from.xW || 0) + ((to.xW || 0) - (from.xW || 0)) * t,
      yW: (from.yW || 0) + ((to.yW || 0) - (from.yW || 0)) * t,
    };
    if (!pointInBounds(point, bounds.loops)) return false;
  }
  return true;
}

function estimateBoundedPathDistance(from = {}, to = {}, bounds = {}, stepPx = 80) {
  if (bounds && bounds.nav && typeof bounds.nav.distanceThroughLevel === "function") {
    return bounds.nav.distanceThroughLevel(from, to);
  }
  const direct = distance(from, to);
  if (!bounds || !bounds.box || !Array.isArray(bounds.loops) || !bounds.loops.length) return direct;
  const step = Math.max(8, stepPx);
  if (segmentInBounds(from, to, bounds, step * 0.5)) return direct;
  const box = bounds.box;
  const cols = Math.max(1, Math.ceil((box.rightXW - box.leftXW) / step));
  const rows = Math.max(1, Math.ceil((box.bottomYW - box.topYW) / step));
  if (cols * rows > 10000) return direct * 1.4;
  const key = (col, row) => `${col},${row}`;
  const cellPoint = (col, row) => ({
    xW: box.leftXW + (col + 0.5) * step,
    yW: box.topYW + (row + 0.5) * step,
  });
  const cellForPoint = (point) => ({
    col: clampNumber(Math.floor(((point.xW || 0) - box.leftXW) / step), 0, 0, cols - 1),
    row: clampNumber(Math.floor(((point.yW || 0) - box.topYW) / step), 0, 0, rows - 1),
  });
  const start = cellForPoint(from);
  const goal = cellForPoint(to);
  const open = [{ col: start.col, row: start.row, cost: 0, score: direct }];
  const best = new Map([[key(start.col, start.row), 0]]);
  const closed = new Set();
  const neighbors = [
    [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
    [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, 1, Math.SQRT2],
  ];
  while (open.length) {
    open.sort((a, b) => a.score - b.score);
    const current = open.shift();
    const currentKey = key(current.col, current.row);
    if (closed.has(currentKey)) continue;
    if (current.col === goal.col && current.row === goal.row) {
      return current.cost + distance(from, cellPoint(start.col, start.row)) + distance(to, cellPoint(goal.col, goal.row));
    }
    closed.add(currentKey);
    for (const [dc, dr, weight] of neighbors) {
      const col = current.col + dc;
      const row = current.row + dr;
      if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
      const neighborKey = key(col, row);
      if (closed.has(neighborKey)) continue;
      const point = cellPoint(col, row);
      if (!pointInBounds(point, bounds.loops)) continue;
      const nextCost = current.cost + step * weight;
      if (nextCost >= (best.get(neighborKey) ?? Infinity)) continue;
      best.set(neighborKey, nextCost);
      open.push({
        col,
        row,
        cost: nextCost,
        score: nextCost + distance(point, to),
      });
    }
  }
  return direct * 1.4;
}

function pathDistanceCacheKey(from = {}, to = {}, stepPx = 80) {
  const step = Math.max(1, Number(stepPx) || 80);
  const fx = Math.round((Number(from.xW) || 0) / step);
  const fy = Math.round((Number(from.yW) || 0) / step);
  const tx = Math.round((Number(to.xW) || 0) / step);
  const ty = Math.round((Number(to.yW) || 0) / step);
  return `${fx},${fy}:${tx},${ty}:${Math.round(step)}`;
}

function buildRouteSegments({ from, to, spacingPx = 80, jitterPx = 0, bounds = {} } = {}) {
  if (bounds && bounds.nav && typeof bounds.nav.buildRouteSegments === "function") {
    return bounds.nav.buildRouteSegments({
      from,
      to,
      spacingWorld: spacingPx,
      jitterWorld: jitterPx,
    });
  }
  const total = Math.max(0.001, distance(from, to));
  const count = Math.max(1, Math.ceil(total / Math.max(1, spacingPx)));
  const segments = [];
  for (let i = 1; i <= count; i += 1) {
    const t = i / count;
    const xW = (from.xW || 0) + ((to.xW || 0) - (from.xW || 0)) * t + randomUnit() * jitterPx;
    const yW = (from.yW || 0) + ((to.yW || 0) - (from.yW || 0)) * t + randomUnit() * jitterPx;
    segments.push(resolveBoundedPoint({ xW, yW }, {
      fallback: segments[segments.length - 1] || from,
      loops: bounds.loops,
      box: bounds.box,
      nav: bounds.nav,
    }));
  }
  segments[segments.length - 1] = resolveBoundedPoint(to, {
    fallback: segments[segments.length - 2] || from,
    loops: bounds.loops,
    box: bounds.box,
    nav: bounds.nav,
  });
  return segments;
}

export function createGnatSwarm3dRuntime({
  group = null,
  toRuntimePosition = ({ xW = 0, yW = 0, z = 0 } = {}) => ({ x: xW, y: yW, z }),
  getBo = () => 42,
  getOrbZBO = () => 4,
  getConfig = () => null,
  onCombatEvent = null,
  onNeedsFrame = null,
} = {}) {
	  const root = group || new THREE.Group();
	  const material = new THREE.MeshStandardMaterial({
	    color: 0xffffff,
	    emissive: 0xffffff,
	    emissiveIntensity: 1.4,
	    roughness: 0.48,
	    metalness: 0.08,
  });
	  tintEmissiveWithInstanceColor(material);
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const burnVisualDiagnostics = readBurnVisualDiagnostics();
  const fireCards = createFireCardSystem({
    root,
    maxCards: 256,
    debugSolid: burnVisualDiagnostics.solidCards,
  });
  let mesh = null;
  let states = [];
  let bounds = Object.freeze({ loops: [], box: null });
  let activeSignals = [];
  const alertTrace = { direct: 0, relayed: 0, feeding: 0, stunned: 0, liftLeach: 0, lifeLeachPerSec: 0, shieldImmune: false, shieldContactRadiusPx: 0, signals: 0, nav: false, navCells: 0, navResolutionBo: null, flameDamage: null };
  let pendingLifeLeachDamage = 0;
  let lastDamageEmitAtMs = 0;
  let lastMotionEmitAtMs = 0;
  let lastLiftPenalty = 0;
  let lastFeedingCount = 0;

  function disposeMesh() {
    if (mesh) {
      root.remove(mesh);
      mesh = null;
    }
    states = [];
    activeSignals = [];
    pendingLifeLeachDamage = 0;
    lastDamageEmitAtMs = 0;
    lastMotionEmitAtMs = 0;
    lastLiftPenalty = 0;
    lastFeedingCount = 0;
    fireCards.beginFrame(0);
    fireCards.endFrame();
    Object.assign(alertTrace, { direct: 0, relayed: 0, feeding: 0, stunned: 0, liftLeach: 0, lifeLeachPerSec: 0, shieldImmune: false, shieldContactRadiusPx: 0, signals: 0, nav: false, navCells: 0, navResolutionBo: null, flameDamage: null });
  }

  function compactActiveSignals(nowSec = 0) {
    let write = 0;
    for (let read = 0; read < activeSignals.length; read += 1) {
      const signal = activeSignals[read];
      if (!signal || signal.expiresAt < nowSec || signal.strength <= 0) continue;
      activeSignals[write] = signal;
      write += 1;
    }
    activeSignals.length = write;
    return write;
  }

  function estimateCachedPathDistance(from = {}, to = {}, stepPx = 80, cache = null) {
    if (!cache) return estimateBoundedPathDistance(from, to, bounds, stepPx);
    const key = pathDistanceCacheKey(from, to, stepPx);
    if (cache.has(key)) return cache.get(key);
    const resolved = estimateBoundedPathDistance(from, to, bounds, stepPx);
    cache.set(key, resolved);
    return resolved;
  }

  function emitFeedingCombat({ nowMs = 0, dtSec = 0.016, feedingCount = 0, activeLiftLeach = 0, activeLifeLeachPerSec = 0 } = {}) {
    if (typeof onCombatEvent !== "function") return;
    const atMs = Number(nowMs) || 0;
    pendingLifeLeachDamage += Math.max(0, activeLifeLeachPerSec) * Math.max(0, dtSec);
    const liftChanged = Math.abs(activeLiftLeach - lastLiftPenalty) > 0.001 || feedingCount !== lastFeedingCount;
    const shouldEmitLift = activeLiftLeach > 0 || lastLiftPenalty > 0;
    if (shouldEmitLift && (liftChanged || atMs - lastMotionEmitAtMs >= GNAT_COMBAT_EMIT_INTERVAL_MS)) {
      onCombatEvent("combat.motion_modifier_changed", {
        kind: COMBAT_EFFECT_MOTION_MODIFIER,
        modifierId: "gnat-swarm:feeding",
        sourceEntityId: "enemy:gnat-swarm",
        targetEntityId: COMBAT_ENTITY_ORB,
        liftPenalty: activeLiftLeach,
        liftMultiplier: 1,
        durationMs: GNAT_LIFT_MODIFIER_DURATION_MS,
        atMs,
        tags: ["enemy", "gnat-swarm", "feeding", "lift-leach"],
        meta: {
          feedingCount,
          liftLeachPerGnat: feedingCount > 0 ? activeLiftLeach / feedingCount : 0,
        },
      });
      lastMotionEmitAtMs = atMs;
      lastLiftPenalty = activeLiftLeach;
      lastFeedingCount = feedingCount;
    }
    if (pendingLifeLeachDamage > 0 && (atMs - lastDamageEmitAtMs >= GNAT_COMBAT_EMIT_INTERVAL_MS || activeLifeLeachPerSec <= 0)) {
      const damageAmount = pendingLifeLeachDamage;
      pendingLifeLeachDamage = 0;
      lastDamageEmitAtMs = atMs;
      onCombatEvent("combat.damage_requested", {
        kind: COMBAT_EFFECT_DAMAGE,
        amount: damageAmount,
        damageType: DAMAGE_TYPE_LEECH,
        cause: DAMAGE_TYPE_LEECH,
        sourceEntityId: "enemy:gnat-swarm",
        targetEntityId: COMBAT_ENTITY_ORB,
        atMs,
        tags: ["enemy", "gnat-swarm", "feeding", "life-leach"],
        meta: {
          sourceSystem: "gnat-swarm-feeding",
          feedingCount,
          lifeLeachPerSec: activeLifeLeachPerSec,
        },
      });
    }
  }

  function chooseDestination(state) {
    return randomBoundedPointAround(
      state.spawn,
      state.wanderRangeMaxPx,
      bounds,
      state.wanderRangeMinPx,
      state.wanderRangeCurve,
    );
  }

  function chooseIdleTarget(state) {
    return randomBoundedPointAround(state.spawn, state.spawnRadiusPx, bounds);
  }

  function scheduleIdleTarget(state, nowSec = 0) {
    state.target = chooseIdleTarget(state);
    state.nextTargetAt = nowSec + randomInRange(state.idleRetargetSec, 1);
  }

  function scheduleWanderTarget(state, nowSec = 0) {
    if (state.mode === "linger") {
      state.target = randomBoundedPointAround(state.destination, state.arrivalRadiusPx, bounds);
    } else {
      const segment = state.route[state.routeIndex] || state.destination || state.spawn;
      const rerollRadius = state.mode === "return" ? state.returnRerollRadiusPx : state.outboundRerollRadiusPx;
      state.target = randomBoundedPointAround(segment, rerollRadius, bounds);
    }
    state.nextTargetAt = nowSec + randomInRange(state.idleRetargetSec, 1);
  }

  function startCooldown(state, nowSec = 0) {
    state.mode = "cooldown";
    state.route = [];
    state.routeIndex = 0;
    state.isDwelling = false;
    state.nextRouteAt = nowSec + randomInRange(state.cooldownSec, 4);
    scheduleIdleTarget(state, nowSec);
  }

  function startWander(state, nowSec = 0) {
    const destination = chooseDestination(state);
    state.mode = "outbound";
    state.destination = destination;
    state.isDwelling = false;
    state.route = buildRouteSegments({
      from: state.position,
      to: destination,
      spacingPx: randomInRange(state.segmentSpacingPx, 96),
      jitterPx: state.segmentJitterPx * Math.max(0.25, 1.15 - state.routeCommitment * 0.75),
      bounds,
    });
    state.routeIndex = 0;
    state.target = state.route[0] || destination;
    scheduleWanderTarget(state, nowSec);
  }

  function startReturn(state, nowSec = 0) {
    state.mode = "return";
    state.orbTarget = null;
    state.alertStrength = 0;
    state.destination = state.spawn;
    state.isDwelling = false;
    state.route = buildRouteSegments({
      from: state.position,
      to: state.spawn,
      spacingPx: randomInRange(state.returnSegmentSpacingPx || state.segmentSpacingPx, 96) * Math.max(0.45, 1 - state.returnBias * 0.3),
      jitterPx: state.segmentJitterPx * Math.max(0.2, 1 - state.returnBias * 0.6),
      bounds,
    });
    state.routeIndex = 0;
    state.target = state.route[0] || state.spawn;
    scheduleWanderTarget(state, nowSec);
  }

  function startStun(state, stun = {}, nowSec = 0) {
    if (!state || state.hp <= 0) return false;
    state.mode = "stunned";
    state.orbTarget = null;
    state.alertStrength = 0;
    state.route = [];
    state.routeIndex = 0;
    state.isDwelling = false;
    state.target = state.position;
    state.stunUntilSec = Math.max(state.stunUntilSec || 0, nowSec + Math.max(0.05, Number(stun.durationMs || state.stunDurationMs || 0) / 1000));
    state.stunBounceRemaining = 1;
    state.velocity.xW *= 0.42;
    state.velocity.yW = Math.max(state.velocity.yW * 0.16, state.stunGravityPxPerSec2 * 0.035);
    return true;
  }

  function startDeath(state, nowSec = 0) {
    if (!state || state.deathStartedSec) return false;
    const wasBurning = syncBurnVisualFromStatus(state, nowSec) || resolveBurningRuntimeState(state, nowSec).active;
    state.mode = "dead";
    state.orbTarget = null;
    state.alertStrength = 0;
    state.signalFlashUntil = 0;
    state.route = [];
    state.routeIndex = 0;
    state.isDwelling = false;
    state.target = state.position;
    state.deathStartedSec = nowSec;
    state.deathHideSec = nowSec + randomInRange(GNAT_DEATH_LINGER_RANGE_SEC, 6.5);
    state.burnDeathActive = !!wasBurning;
    state.burnGroundedSec = 0;
    state.stunBounceRemaining = 1;
    state.velocity.xW *= 0.42;
    state.velocity.yW = Math.max(state.velocity.yW * 0.16, state.stunGravityPxPerSec2 * 0.035);
    return true;
  }

  function normalizeDamageEffect(effect = {}) {
    const atMs = Number.isFinite(Number(effect.atMs))
      ? Number(effect.atMs)
      : (typeof performance !== "undefined" && performance.now ? performance.now() : 0);
    const damageType = String(effect.damageType || DAMAGE_TYPE_FIRE);
    const burning = damageType === DAMAGE_TYPE_FIRE
      ? normalizeBurningStatus({
          ...effect,
          igniteDamage: effect.amount,
        }, { atMs })
      : null;
    return Object.freeze({
      amount: Math.max(0, Number(effect.amount) || 0),
      damageType,
      atMs,
      burning,
    });
  }

  function pointInDamageVolume(position, center, effect = {}, bo = 42) {
    return resolveDamageVolumeHit(position, center, effect, bo).inside;
  }

  function resolveDamageTargetPaddingBo(state, bo = 42) {
    if (!state) return 0;
    const radiusPx = Math.max(0, Number(state.gnatRadiusPx) || 0);
    return radiusPx / Math.max(1, bo);
  }

  function resolvePaddedDamageEffect(effect = {}, targetPaddingBo = 0) {
    const paddingBo = Math.max(0, Number(targetPaddingBo) || 0);
    if (paddingBo <= 0) return effect;
    const radiusBo = Math.max(0, Number(effect.radiusBo) || 0) + paddingBo;
    const forwardRadiusBo = Math.max(
      radiusBo,
      Math.max(0, Number(effect.forwardRadiusBo || effect.wakeRadiusBo || 0)) + paddingBo
    );
    return {
      ...effect,
      radiusBo,
      forwardRadiusBo,
    };
  }

  function resolveDamageVolumeHit(position, center, effect = {}, bo = 42) {
    const radiusPx = Math.max(0, Number(effect.radiusBo) || 0) * bo;
    const forwardRadiusPx = Math.max(radiusPx, Number(effect.forwardRadiusBo || effect.wakeRadiusBo || 0) * bo);
    const empty = {
      inside: false,
      distancePx: Infinity,
      distanceBo: Infinity,
      alongPx: 0,
      sidePx: 0,
      radiusPx,
      forwardRadiusPx,
      alongN: Infinity,
      sideN: Infinity,
    };
    if (!position || !center || radiusPx <= 0) return empty;
    const axis = effect.axisWorld && typeof effect.axisWorld === "object" ? effect.axisWorld : { xW: 0, yW: -1 };
    const axisX = Number(axis.xW) || 0;
    const axisY = Number(axis.yW) || -1;
    const axisLen = Math.hypot(axisX, axisY) || 1;
    const ux = axisX / axisLen;
    const uy = axisY / axisLen;
    const dx = (Number(position.xW) || 0) - (Number(center.xW) || 0);
    const dy = (Number(position.yW) || 0) - (Number(center.yW) || 0);
    const distancePx = Math.hypot(dx, dy);
    if (forwardRadiusPx <= radiusPx + 0.001) {
      return {
        ...empty,
        inside: distancePx <= radiusPx,
        distancePx,
        distanceBo: distancePx / Math.max(1, bo),
        alongPx: 0,
        sidePx: distancePx,
        alongN: 0,
        sideN: distancePx / Math.max(1, radiusPx),
      };
    }
    const along = dx * ux + dy * uy;
    const side = Math.abs(dx * -uy + dy * ux);
    const alongRadius = along >= 0 ? forwardRadiusPx : radiusPx;
    const alongN = Math.abs(along) / Math.max(1, alongRadius);
    const sideN = side / Math.max(1, radiusPx);
    return {
      ...empty,
      inside: alongN * alongN + sideN * sideN <= 1,
      distancePx,
      distanceBo: distancePx / Math.max(1, bo),
      alongPx: along,
      sidePx: side,
      alongN,
      sideN,
    };
  }

  function applyDamageToState(state, damage = {}, nowSec = 0) {
    if (!state || state.hp <= 0) return false;
    const amount = Math.max(0, Number(damage.amount) || 0);
    if (amount > 0) state.hp = Math.max(0, Number(state.hp) - amount);
    if (damage.damageType === DAMAGE_TYPE_FIRE && damage.burning) {
      applyBurningStatusToEntity(state, damage.burning, nowSec);
      syncBurnVisualFromStatus(state, nowSec);
    }
    if (state.hp <= 0) startDeath(state, nowSec);
    return true;
  }

  function applyPeriodicFireDamage(state, nowSec = 0, dtSec = 0) {
    if (!state || state.hp <= 0) return 0;
    syncBurnVisualFromStatus(state, nowSec);
    const damage = tickBurningStatusOnEntity(state, nowSec, dtSec);
    if (state.hp <= 0) startDeath(state, nowSec);
    return damage;
  }

  function releaseOrbTargets({ atMs = null } = {}) {
    const now = Number(atMs);
    const nowSec = Number.isFinite(now)
      ? now / 1000
      : (typeof performance !== "undefined" && performance.now ? performance.now() / 1000 : 0);
    let released = 0;
    activeSignals = [];
    for (const state of states) {
      if (!state || (state.mode !== "alerted" && state.mode !== "feeding")) continue;
      state.velocity.xW *= 0.35;
      state.velocity.yW *= 0.35;
      startReturn(state, nowSec);
      released += 1;
    }
    if (released > 0 && typeof onNeedsFrame === "function") onNeedsFrame();
    return released;
  }

  function applyCombatEffect(effect = {}) {
    const kind = String(effect && effect.kind || "");
    const center = effect.centerWorld || effect.center || null;
    if (!center || !Number.isFinite(Number(center.xW)) || !Number.isFinite(Number(center.yW))) {
      return Object.freeze({ handled: false, affected: 0, reason: "missing_center" });
    }
    const bo = Math.max(1, Number(getBo()) || 42);
    if (kind === COMBAT_EFFECT_DAMAGE) {
      const damage = normalizeDamageEffect(effect);
      const nowSec = damage.atMs / 1000;
      let affected = 0;
      let totalDamage = 0;
      const damageTrace = {
        kind,
        damageType: damage.damageType,
        atMs: Math.round(damage.atMs),
        bo,
        center: { xW: Number(center.xW) || 0, yW: Number(center.yW) || 0 },
        radiusBo: Math.max(0, Number(effect.radiusBo) || 0),
        forwardRadiusBo: Math.max(0, Number(effect.forwardRadiusBo || effect.wakeRadiusBo || 0)),
        amount: damage.amount,
        totalStates: states.length,
        alive: 0,
        tested: 0,
        inRange: 0,
        affected: 0,
        totalDamage: 0,
        nearestBo: null,
        nearest: null,
        candidates: [],
      };
      for (const state of states) {
        if (!state || state.hp <= 0) continue;
        damageTrace.alive += 1;
        damageTrace.tested += 1;
        const targetPaddingBo = resolveDamageTargetPaddingBo(state, bo);
        const paddedEffect = resolvePaddedDamageEffect(effect, targetPaddingBo);
        const hit = resolveDamageVolumeHit(state.position, center, paddedEffect, bo);
        if (Number.isFinite(hit.distanceBo) && (damageTrace.nearestBo == null || hit.distanceBo < damageTrace.nearestBo)) {
          damageTrace.nearestBo = Number(hit.distanceBo.toFixed(3));
          damageTrace.nearest = {
            index: state.index,
            hp: Number(state.hp) || 0,
            mode: String(state.mode || ""),
            distanceBo: Number(hit.distanceBo.toFixed(3)),
            targetPaddingBo: Number(targetPaddingBo.toFixed(3)),
            effectiveRadiusBo: Number((hit.radiusPx / Math.max(1, bo)).toFixed(3)),
            effectiveForwardRadiusBo: Number((hit.forwardRadiusPx / Math.max(1, bo)).toFixed(3)),
            alongBo: Number((hit.alongPx / Math.max(1, bo)).toFixed(3)),
            sideBo: Number((hit.sidePx / Math.max(1, bo)).toFixed(3)),
            alongN: Number(hit.alongN.toFixed(3)),
            sideN: Number(hit.sideN.toFixed(3)),
            inside: !!hit.inside,
          };
        }
        if (damageTrace.candidates.length < 6) {
          damageTrace.candidates.push({
            index: state.index,
            hp: Number(state.hp) || 0,
            mode: String(state.mode || ""),
            distanceBo: Number((hit.distanceBo || 0).toFixed(3)),
            targetPaddingBo: Number(targetPaddingBo.toFixed(3)),
            effectiveRadiusBo: Number((hit.radiusPx / Math.max(1, bo)).toFixed(3)),
            alongBo: Number((hit.alongPx / Math.max(1, bo)).toFixed(3)),
            sideBo: Number((hit.sidePx / Math.max(1, bo)).toFixed(3)),
            inside: !!hit.inside,
          });
        }
        if (!hit.inside) continue;
        damageTrace.inRange += 1;
        const beforeHp = Number(state.hp) || 0;
        if (!applyDamageToState(state, damage, nowSec)) continue;
        affected += 1;
        totalDamage += Math.max(0, beforeHp - (Number(state.hp) || 0));
        if (typeof onCombatEvent === "function") {
          onCombatEvent("combat.damage_applied", {
            ...damage,
            targetEntityId: `enemy:gnat-swarm:${state.index}`,
            hp: state.hp,
            maxHp: state.maxHp,
          });
        }
      }
      damageTrace.affected = affected;
      damageTrace.totalDamage = Number(totalDamage.toFixed(3));
      alertTrace.flameDamage = damageTrace;
      if (affected > 0 && typeof onNeedsFrame === "function") onNeedsFrame();
      return Object.freeze({ handled: true, affected, totalDamage, trace: damageTrace });
    }
    if (kind !== COMBAT_EFFECT_STUN) return Object.freeze({ handled: false, affected: 0, reason: "unsupported_effect" });
    const stun = normalizeStunEffect(effect);
    const radiusPx = Math.max(0, Number(effect.radiusBo) || 0) * bo;
    const nowSec = stun.atMs / 1000;
    let affected = 0;
    for (const state of states) {
      if (!state || state.hp <= 0) continue;
      if (radiusPx > 0 && distance(state.position, center) > radiusPx) continue;
      const result = resolveStunApplication({
        amount: stun.amount,
        threshold: state.stunThreshold,
        durationMs: state.stunDurationMs,
        atMs: stun.atMs,
      });
      if (!result.stunned) continue;
      const receivedStun = { ...stun, durationMs: state.stunDurationMs };
      if (!startStun(state, receivedStun, nowSec)) continue;
      affected += 1;
      if (typeof onCombatEvent === "function") {
        onCombatEvent("combat.stun_applied", {
          ...receivedStun,
          targetEntityId: `enemy:gnat-swarm:${state.index}`,
          threshold: state.stunThreshold,
          stunUntilMs: result.stunUntilMs,
        });
      }
    }
    if (affected > 0 && typeof onNeedsFrame === "function") onNeedsFrame();
    return Object.freeze({ handled: true, affected });
  }

  function advanceRoute(state, nowSec = 0, onFinished = null) {
    if (state.isDwelling) {
      if (nowSec < state.dwellUntil) return;
      state.isDwelling = false;
      state.routeIndex += 1;
    } else if (state.segmentDwellSec > 0 && state.routeIndex < state.route.length - 1) {
      state.isDwelling = true;
      state.dwellUntil = nowSec + state.segmentDwellSec;
      scheduleWanderTarget(state, nowSec);
      return;
    } else {
      state.routeIndex += 1;
    }
    if (state.routeIndex >= state.route.length) {
      if (typeof onFinished === "function") onFinished();
    } else {
      scheduleWanderTarget(state, nowSec);
    }
  }

	  function emitSignal(state, nowSec = 0, strength = 1, generation = 0) {
	    if (!state || strength < state.minSignalStrength || generation > state.signalHops) return;
	    state.signalFlashUntil = Math.max(state.signalFlashUntil || 0, nowSec + GNAT_SIGNAL_FLASH_SEC);
	    activeSignals.push({
      sourceIndex: state.index,
      position: { xW: state.position.xW, yW: state.position.yW },
      orbPosition: state.orbTarget ? { xW: state.orbTarget.xW, yW: state.orbTarget.yW } : null,
      strength,
      generation,
      expiresAt: nowSec + state.signalMemorySec,
    });
  }

  function startAlert(state, orbPosition = null, nowSec = 0, {
    strength = 1,
    generation = 0,
    source = "direct",
  } = {}) {
    if (!state || !orbPosition) return;
    if (state.mode === "feeding") return;
    state.mode = "alerted";
    state.isDwelling = false;
    state.orbTarget = { xW: orbPosition.xW, yW: orbPosition.yW };
    state.destination = state.orbTarget;
    state.route = buildRouteSegments({
      from: state.position,
      to: state.orbTarget,
      spacingPx: randomInRange(state.segmentSpacingPx, 96),
      jitterPx: state.segmentJitterPx * 0.45,
      bounds,
    });
    state.routeIndex = 0;
    state.target = state.route[0] || state.orbTarget;
    state.nextTargetAt = nowSec + Math.min(0.35, randomInRange(state.idleRetargetSec, 1));
    state.nextDetectAt = nowSec + state.detectionCheckSec;
    state.nextSignalCheckAt = nowSec + state.signalCheckSec;
    state.nextRelayAt = nowSec + state.signalCooldownSec;
    state.alertGeneration = generation;
    state.alertStrength = strength;
    state.alertSource = source;
    emitSignal(state, nowSec, strength, generation);
  }

  function scheduleAlertTarget(state, orbPosition = null, nowSec = 0) {
    if (!state || !orbPosition) return;
    state.orbTarget = { xW: orbPosition.xW, yW: orbPosition.yW };
    const targetMoved = distance(state.destination || state.orbTarget, state.orbTarget);
    if (!state.route.length || targetMoved > Math.max(state.arrivalRadiusPx, state.segmentSpacingPx[0] * 0.5)) {
      state.destination = state.orbTarget;
      state.route = buildRouteSegments({
        from: state.position,
        to: state.orbTarget,
        spacingPx: randomInRange(state.segmentSpacingPx, 96),
        jitterPx: state.segmentJitterPx * 0.35,
        bounds,
      });
      state.routeIndex = 0;
    }
    const segment = state.route[state.routeIndex] || state.orbTarget;
    state.target = randomBoundedPointAround(segment, state.outboundRerollRadiusPx * 0.5, bounds);
    state.nextTargetAt = nowSec + Math.max(0.15, Math.min(0.75, randomInRange(state.idleRetargetSec, 1)));
  }

  function startFeeding(state, orbPosition = null, nowSec = 0) {
    if (!state || !orbPosition) return;
    state.mode = "feeding";
    state.orbTarget = { xW: orbPosition.xW, yW: orbPosition.yW };
    const normal = normalFromPoints(state.orbTarget, state.position, state.feedAngle);
    state.feedAngle = Math.atan2(normal.yW, normal.xW);
    state.feedLatchAngle = state.feedAngle;
    state.feedPhase = Math.random() * Math.PI * 2;
    state.feedMigrationDirection = Math.random() < 0.5 ? -1 : 1;
    state.nextFeedMigrationAt = nowSec + randomInRange(state.feedMigrationRetargetSec, 3.5);
    state.velocity.xW *= 0.18;
    state.velocity.yW *= 0.18;
    if (!Number.isFinite(state.feedAngle)) state.feedAngle = Math.random() * Math.PI * 2;
    if (!Number.isFinite(state.feedLatchAngle)) state.feedLatchAngle = state.feedAngle;
    state.nextTargetAt = nowSec;
    emitSignal(state, nowSec, Math.max(state.minSignalStrength, state.alertStrength * state.signalDecay), state.alertGeneration + 1);
  }

  function resolveFeedContactRadiusPx(state = null, orbCombat = null) {
    if (!state) return 1;
    const shieldRadiusPx = Math.max(0, Number(orbCombat && orbCombat.radiusWorldUnits) || Number(orbCombat && orbCombat.contactRadiusPx) || 0);
    const shieldContactRadiusPx = shieldRadiusPx > 0
      ? shieldRadiusPx + Math.max(0, Number(state.feedContactPaddingPx) || 0)
      : 0;
    return Math.max(1, Number(state.feedContactRadiusPx) || 1, shieldContactRadiusPx);
  }

  function resolveFeedOuterRadiusPx(state = null, orbCombat = null) {
    if (!state) return 1;
    return resolveFeedContactRadiusPx(state, orbCombat) + Math.max(1, Number(state.feedBandPx) || 1);
  }

  function scheduleFeedTarget(state, orbPosition = null, nowSec = 0, orbCombat = null) {
    if (!state || !orbPosition) return;
    state.orbTarget = { xW: orbPosition.xW, yW: orbPosition.yW };
    if (nowSec >= state.nextFeedMigrationAt) {
      state.feedMigrationDirection = Math.random() < 0.5 ? -1 : 1;
      state.nextFeedMigrationAt = nowSec + randomInRange(state.feedMigrationRetargetSec, 3.5);
    }
    const feedContactRadiusPx = resolveFeedContactRadiusPx(state, orbCombat);
    const feedMigrationRadPerSec = Math.max(0, Number(state.feedMigrationPxPerSec) || 0) / Math.max(1, feedContactRadiusPx);
    state.feedLatchAngle += state.feedMigrationDirection * feedMigrationRadPerSec * Math.max(0.001, state.lastFeedDt || 0.016);
    state.feedLatchAngle += state.feedOrbitSpeed * Math.max(0.001, state.lastFeedDt || 0.016);
    state.feedAngle = state.feedLatchAngle;
    const pulse = (Math.sin(nowSec * state.feedNipHz * Math.PI * 2 + state.feedPhase) + 1) * 0.5;
    const nipOffsetPx = (pulse * pulse) * state.feedNipDepthPx;
    const twitchPx = randomUnit() * state.feedNipDepthPx * 0.18;
    const targetRadiusPx = feedContactRadiusPx + Math.max(0, nipOffsetPx + twitchPx);
    state.target = {
      xW: state.orbTarget.xW + Math.cos(state.feedAngle) * targetRadiusPx,
      yW: state.orbTarget.yW + Math.sin(state.feedAngle) * targetRadiusPx,
    };
    state.nextTargetAt = nowSec + 0.035 + Math.random() * 0.045;
  }

  function resolveOrbContact(state, next = null, orbPosition = null, orbCombat = null) {
    if (!state || !next || !orbPosition) return next;
    const dx = next.xW - orbPosition.xW;
    const dy = next.yW - orbPosition.yW;
    const d = Math.hypot(dx, dy);
    const feedContactRadiusPx = resolveFeedContactRadiusPx(state, orbCombat);
    const feedOuterRadiusPx = resolveFeedOuterRadiusPx(state, orbCombat);
    if (d >= feedContactRadiusPx && (state.mode !== "feeding" || d <= feedOuterRadiusPx)) return next;
    const normal = normalFromPoints(orbPosition, next, state.feedAngle);
    const targetRadiusPx = state.mode === "feeding"
      ? clampNumber(d, feedContactRadiusPx, feedContactRadiusPx, feedOuterRadiusPx)
      : feedContactRadiusPx;
    const projected = {
      xW: orbPosition.xW + normal.xW * targetRadiusPx,
      yW: orbPosition.yW + normal.yW * targetRadiusPx,
    };
    const inwardSpeed = state.velocity.xW * normal.xW + state.velocity.yW * normal.yW;
    if (inwardSpeed < 0) {
      state.velocity.xW -= (1 + state.feedBounce) * inwardSpeed * normal.xW;
      state.velocity.yW -= (1 + state.feedBounce) * inwardSpeed * normal.yW;
    }
    if (state.mode === "feeding" && d > feedOuterRadiusPx) {
      state.velocity.xW *= 0.42;
      state.velocity.yW *= 0.42;
    } else {
      state.velocity.xW += normal.xW * state.feedBounce * 10;
      state.velocity.yW += normal.yW * state.feedBounce * 10;
    }
    return projected;
  }

  function load(spawns = [], {
    boundaryLoops = [],
    boundaryBox = null,
    navGrid = null,
  } = {}) {
    disposeMesh();
    bounds = Object.freeze({
      loops: Array.isArray(boundaryLoops) ? boundaryLoops : [],
      box: boundaryBox || null,
      nav: navGrid || null,
    });
    Object.assign(alertTrace, {
      direct: 0,
      relayed: 0,
      feeding: 0,
      stunned: 0,
      liftLeach: 0,
      lifeLeachPerSec: 0,
      shieldImmune: false,
      shieldContactRadiusPx: 0,
      signals: 0,
      nav: !!bounds.nav,
      navCells: bounds.nav ? (bounds.nav.cols || 0) * (bounds.nav.rows || 0) : 0,
      navResolutionBo: bounds.nav ? bounds.nav.resolutionBo : null,
    });
    const config = getConfig() || {};
    const swarm = config.swarm || {};
    const damageReceive = swarm.damageReceive || {};
    const damageDeliver = swarm.damageDeliver || {};
    const gnat = config.gnat || {};
    const idle = gnat.idle || {};
    const personality = gnat.personalityRanges || {};
    const spawnCurves = swarm.spawnCurves || {};
    const countPerSpawn = Math.max(1, Math.round(clampNumber(swarm.gnatsTotal, 24, 1, 240)));
    const bo = Math.max(1, Number(getBo()) || 42);
    const baseSpeed = rangePair(swarm.baseSpeedBoPerSec, [1.35, 3.2]);
    const speedX = rangePair(personality.speed, [1, 1]);
    const wanderRangeBo = rangePair(personality.wanderRangeBo, [4, 8]);
    const wanderChancePerMinute = rangePair(personality.wanderChancePerMinute, [16, 16]);
    const segmentSpacingBo = rangePair(personality.wanderSegmentSpacingBo, [3, 7]);
    const segmentJitterBo = rangePair(personality.wanderSegmentJitterBo, [0.5, 2]);
    const cooldownSec = rangePair(personality.wanderCooldownSec, [1, 5]);
    const targetRetargetMinSec = rangePair(idle.targetRetargetMinSec, [0.28, 0.28]);
    const targetRetargetMaxSec = rangePair(idle.targetRetargetMaxSec, [1.25, 1.25]);
    const targetJitterBo = rangePair(idle.targetJitterBo, [0.42, 0.42]);
    const springStiffness = rangePair(idle.springStiffness, [18, 18]);
    const springDamping = rangePair(idle.springDamping, [6.5, 6.5]);
    const elasticJitterBo = rangePair(idle.elasticJitterBo, [0.12, 0.12]);
    const elasticJitterHz = rangePair(idle.elasticJitterHz, [9, 9]);
    const lingerSec = rangePair(personality.lingerSec, [0.4, 0.4]);
    const segmentDwellSec = rangePair(personality.segmentDwellSec, [0, 0]);
    const routeCommitment = rangePair(personality.routeCommitment, [0.82, 0.82]);
    const returnBias = rangePair(personality.returnBias, [0.82, 0.82]);
    const wanderCurve = clampNumber(personality.wanderCurve, 0, -1, 1);
    const returnSegmentSpacingBo = rangePair(personality.returnSegmentSpacingBo, segmentSpacingBo);
    const arrivalRadiusBo = rangePair(personality.arrivalRadiusBo, [0.34, 0.34]);
    const returnSpeedMultiplier = rangePair(personality.returnSpeedMultiplier, [1.12, 1.12]);
    const spawnRadius = Math.max(0, clampNumber(swarm.spawnRadiusBo, 2, 0, 64)) * bo;
    const gnatSize = Math.max(0.5, clampNumber(swarm.gnatSizeBo, 0.04, 0.005, 1) * bo);
    const authoredZDepthBo = Number(swarm.zDepthBo);
    const resolvedZDepthBo = Number.isFinite(authoredZDepthBo) && authoredZDepthBo > 0
      ? authoredZDepthBo
      : Math.max(0, clampNumber(getOrbZBO(), 4, 0, 500));
    const zDepthPx = -resolvedZDepthBo * bo;
    const detectionRadiusPx = Math.max(0, clampNumber(swarm.detectionRadiusBo, 10, 0, 240) * bo);
    const detectionBaseChance = normalizeUnit(swarm.detectionBaseChance, 0.35);
    const detectionCheckSec = Math.max(0.1, clampNumber(swarm.detectionCheckSec, 1, 0.1, 60));
    const signalRadiusBo = Number.isFinite(Number(swarm.signalRadiusBo)) ? swarm.signalRadiusBo : swarm.telegraphRadiusBo;
    const signalBaseChanceValue = Number.isFinite(Number(swarm.signalBaseChance)) ? swarm.signalBaseChance : swarm.telegraphBaseChance;
    const signalDecayValue = Number.isFinite(Number(swarm.signalDecay)) ? swarm.signalDecay : swarm.telegraphDecay;
    const signalCooldownValue = Number.isFinite(Number(swarm.signalCooldownSec)) ? swarm.signalCooldownSec : swarm.telegraphCooldownSec;
    const signalHopsValue = Number.isFinite(Number(swarm.signalHops)) ? swarm.signalHops : swarm.maxRelayGenerations;
    const signalRadiusPx = Math.max(0, clampNumber(signalRadiusBo, 14, 0, 320) * bo);
    const signalBaseChance = normalizeUnit(signalBaseChanceValue, 0.42);
    const signalDecay = normalizeUnit(signalDecayValue, 0.72);
    const signalCooldownSec = Math.max(0.1, clampNumber(signalCooldownValue, 1, 0.1, 60));
    const signalHops = Math.max(0, Math.round(clampNumber(signalHopsValue, 5, 0, 24)));
    const minSignalStrength = normalizeUnit(swarm.minSignalStrength, 0.08);
    const signalMemorySec = Math.max(0.1, clampNumber(swarm.signalMemorySec, 1.6, 0.1, 60));
    const feedOffsetPx = clampNumber(swarm.feedOffsetBo, 0.08, -4, 12) * bo;
    const feedNipDepthPx = Math.max(0, clampNumber(swarm.feedNipDepthBo, 0.24, 0, 4) * bo);
    const feedNipHz = Math.max(0, clampNumber(swarm.feedNipHz, 7, 0, 40));
    const feedStickiness = normalizeUnit(swarm.feedStickiness, 0.42);
    const feedMigrationPxPerSec = Math.max(0, clampNumber(swarm.feedMigrationBoPerSec, 0.5, 0, 12) * bo);
    const feedMigrationRetargetSec = rangePair(swarm.feedMigrationRetargetSec, [1, 6]);
    const leashChaseBo = rangePair(swarm.leashChaseBo, [40, 40]);
    const leashFeedBo = rangePair(swarm.leashFeedBo, [40, 40]);
    const leashPathStepPx = Math.max(bo, clampNumber(swarm.leashPathStepBo, 2, 0.5, 12) * bo);
    const stunThreshold = Math.max(0, clampNumber(
      damageReceive.stunThreshold,
      scalarSetting(personality.stunThreshold, 1),
      0,
      Infinity,
    ));
    const stunDurationSec = rangePair(damageReceive.stunDurationSec, [2, 2]);
    const stunGravityPxPerSec2 = Math.max(bo * 4, bo * 40);
    const liftLeach = Math.max(0, clampNumber(damageDeliver.liftLeach, 5, 0, 100));
    const lifeLeachPerSec = Math.max(0, clampNumber(damageDeliver.lifeLeachPerSec, 5, 0, 10000));
    const awarenessRange = rangePair(personality.awareness, [0.5, 1]);
    const aggressionRange = rangePair(personality.aggression, [0.2, 0.6]);
    const hpRange = rangePair(personality.hp, [1, 1]);
    const allStates = [];
    for (const spawn of Array.isArray(spawns) ? spawns : []) {
      if (String(spawn && (spawn.enemy || spawn.archetype) || "") !== "gnat-swarm") continue;
      const center = spawn && spawn.worldCenter ? spawn.worldCenter : null;
      if (!center) continue;
      for (let i = 0; i < countPerSpawn; i += 1) {
        const spawnPoint = randomBoundedPointAround(center, spawnRadius, bounds);
        const personalWanderRangeMinBo = Math.max(0, clampNumber(wanderRangeBo[0], 0, 0, Infinity));
        const personalWanderRangeMaxBo = Math.max(personalWanderRangeMinBo, clampNumber(wanderRangeBo[1], 8, 0, Infinity));
        const personalWanderChancePerMinute = randomInRangeWithCurve(
          wanderChancePerMinute,
          16,
          spawnCurves.wanderChancePerMinute,
        );
        const personalRetargetMinSec = randomInRange(targetRetargetMinSec, 0.28);
        const personalRetargetMaxSec = randomInRange(targetRetargetMaxSec, 1.25);
        const personalTargetJitterPx = randomInRange(targetJitterBo, 0.42) * bo;
        const personalElasticJitterPx = randomInRange(elasticJitterBo, 0.12) * bo;
        const personalElasticJitterHz = randomInRange(elasticJitterHz, 9);
        const personalRouteCommitment = clampNumber(randomInRange(routeCommitment, 0.82), 0.82, 0, 1);
        const personalReturnBias = clampNumber(randomInRange(returnBias, 0.82), 0.82, 0, 1);
        const personalArrivalRadiusPx = Math.max(1, randomInRange(arrivalRadiusBo, 0.34) * bo);
        const awareness = Math.max(0, randomInRange(awarenessRange, 0.5));
        const aggression = Math.max(0, randomInRange(aggressionRange, 0.2));
        const state = {
          index: allStates.length,
          mode: "idle",
          position: spawnPoint,
          lastValidPosition: copyPoint(spawnPoint),
          spawn: center,
          destination: spawnPoint,
          target: spawnPoint,
          velocity: { xW: randomUnit() * randomInRange(baseSpeed, 2) * bo, yW: randomUnit() * randomInRange(baseSpeed, 2) * bo },
          route: [],
          routeIndex: 0,
          isDwelling: false,
          dwellUntil: 0,
          lingerUntil: 0,
          nextRouteAt: Math.random() * 2,
          nextTargetAt: Math.random() * 0.5,
          nextDetectAt: Math.random() * detectionCheckSec,
          nextSignalCheckAt: Math.random() * detectionCheckSec,
          nextRelayAt: Math.random() * signalCooldownSec,
          nextLeashCheckAt: Math.random() * 0.35,
          alertGeneration: 0,
          alertStrength: 0,
          alertSource: "",
          maxHp: Math.max(0.1, randomInRange(hpRange, 1)),
          hp: 1,
          stunThreshold,
          stunDurationMs: Math.max(50, randomInRange(stunDurationSec, 2) * 1000),
          stunUntilSec: 0,
          stunBounceRemaining: 0,
          stunGravityPxPerSec2,
          speedPx: Math.max(1, randomInRange(baseSpeed, 2) * randomInRange(speedX, 1) * bo),
          spawnRadiusPx: spawnRadius,
          wanderRangeMinPx: personalWanderRangeMinBo * bo,
          wanderRangeMaxPx: Math.max(personalWanderRangeMinBo, personalWanderRangeMaxBo) * bo,
          wanderRangeCurve: wanderCurve,
          wanderChancePerSec: Math.max(0, personalWanderChancePerMinute / 60),
          segmentSpacingPx: [segmentSpacingBo[0] * bo, segmentSpacingBo[1] * bo],
          returnSegmentSpacingPx: [returnSegmentSpacingBo[0] * bo, returnSegmentSpacingBo[1] * bo],
          segmentJitterPx: randomInRange(segmentJitterBo, 1) * bo,
          cooldownSec,
          lingerSec: randomInRange(lingerSec, 0.4),
          segmentDwellSec: randomInRange(segmentDwellSec, 0),
          routeCommitment: personalRouteCommitment,
          returnBias: personalReturnBias,
          arrivalRadiusPx: personalArrivalRadiusPx,
          returnSpeedMultiplier: randomInRange(returnSpeedMultiplier, 1.12),
          outboundRerollRadiusPx: Math.max(personalArrivalRadiusPx * 0.5, randomInRange(segmentJitterBo, 1) * bo * (1.15 - personalRouteCommitment * 0.75)),
          returnRerollRadiusPx: Math.max(personalArrivalRadiusPx * 0.5, randomInRange(segmentJitterBo, 1) * bo * (0.95 - personalReturnBias * 0.55)),
          stiffness: Math.max(0.1, randomInRange(springStiffness, 18)),
          damping: Math.max(0, randomInRange(springDamping, 6.5)),
          targetJitterPx: Math.max(0, personalTargetJitterPx),
          elasticJitterPx: Math.max(0, personalElasticJitterPx),
          elasticJitterHz: Math.max(0, personalElasticJitterHz),
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          zDepthPx,
          awareness,
          aggression,
          alertSpeedMultiplier: Math.max(0.1, 1 + aggression),
          detectionRadiusPx,
          detectionBaseChance,
          detectionCheckSec,
          signalRadiusPx,
          signalBaseChance,
          signalDecay,
          signalCooldownSec,
          signalCheckSec: detectionCheckSec,
          signalHops,
	          minSignalStrength,
          signalMemorySec,
          signalFlashUntil: 0,
          leashChasePx: Math.max(0, randomInRange(leashChaseBo, 40) * bo),
          leashFeedPx: Math.max(0, randomInRange(leashFeedBo, 40) * bo),
          leashPathStepPx,
          gnatRadiusPx: Math.max(0.5, gnatSize * 0.5),
          feedContactPaddingPx: Math.max(0.5, gnatSize * 0.5) + Math.max(0, feedOffsetPx),
          feedContactRadiusPx: Math.max(1, bo * 0.5 + gnatSize * 0.5 + Math.max(0, feedOffsetPx)),
          feedBandPx: Math.max(1, bo * 0.1),
          feedOuterRadiusPx: Math.max(1, bo * 0.5 + gnatSize * 0.5 + Math.max(0, feedOffsetPx)) + Math.max(1, bo * 0.1),
          feedBounce: 0.46,
          feedNipDepthPx,
          feedNipHz: feedNipHz * (0.85 + Math.random() * 0.3),
          feedStickiness,
          liftLeach,
          lifeLeachPerSec,
          feedMigrationPxPerSec,
          feedMigrationRadPerSec: feedMigrationPxPerSec / Math.max(1, bo * 0.5 + gnatSize * 0.5 + Math.max(0, feedOffsetPx)),
          feedMigrationRetargetSec: [
            Math.max(0.1, feedMigrationRetargetSec[0]),
            Math.max(0.1, feedMigrationRetargetSec[1]),
          ],
          feedMigrationDirection: Math.random() < 0.5 ? -1 : 1,
          nextFeedMigrationAt: Math.random() * 4,
          feedAngle: Math.random() * Math.PI * 2,
          feedLatchAngle: Math.random() * Math.PI * 2,
          feedOrbitSpeed: randomUnit() * clampNumber(swarm.feedLatchDrift, 0.002, 0, 0.08) * (0.5 + aggression),
          feedPhase: Math.random() * Math.PI * 2,
          burnVisualSeed: Math.random() * Math.PI * 2,
          burnVisualUntilSec: 0,
          burnVisualIntensity: 0,
          burnDeathActive: false,
          burnGroundedSec: 0,
          burnAfterDeathUntilSec: 0,
          lastFeedDt: 0.016,
          idleRetargetSec: [
            Math.max(0.05, Math.min(personalRetargetMinSec, personalRetargetMaxSec)),
            Math.max(0.05, Math.max(personalRetargetMinSec, personalRetargetMaxSec)),
          ],
          spin: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          spinSpeed: {
            x: randomUnit() * 5,
            y: randomUnit() * 7,
            z: randomUnit() * 6,
          },
          scale: gnatSize * (0.75 + Math.random() * 0.7),
        };
        state.hp = state.maxHp;
        scheduleIdleTarget(state, 0);
        allStates.push(state);
      }
    }
    states = allStates;
    if (!states.length) return;
    mesh = new THREE.InstancedMesh(geometry, material, states.length);
    mesh.name = "enemy:gnat-swarm";
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(mesh);
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const positionVec = new THREE.Vector3();
  const pathDistanceCache = new Map();

  function setGnatInstanceColor(i = 0, baseColor = GNAT_COLOR_NEUTRAL, state = null, nowSec = 0, { dead = false } = {}) {
    const burning = resolveBurningRuntimeState(state, nowSec);
    if (!burning.active) {
      mesh.setColorAt(i, baseColor);
      return;
    }
    if (burnVisualDiagnostics.disableBody) {
      mesh.setColorAt(i, baseColor);
      return;
    }
    const profile = burning.profile || {};
    const flickerHz = Math.max(1, Number(profile.flickerHz) || 9);
    const seed = Number(state && state.burnVisualSeed) || Number(state && state.phaseX) || 0;
    const waveA = Math.sin(nowSec * flickerHz * 6.283 + seed);
    const waveB = Math.sin(nowSec * (flickerHz * 1.73) * 6.283 + seed * 1.41);
    const flicker01 = Math.max(0, Math.min(1, 0.55 + waveA * 0.28 + waveB * 0.17));
    const tintMix = dead ? 0.62 : 0.72;
    const coreMix = (dead ? 0.18 : 0.30) * flicker01 * Math.min(1.35, burning.intensity);
    GNAT_COLOR_FIRE_TMP.setHex(Number(profile.tintHex) || 0xff7a18);
    GNAT_COLOR_FIRE_CORE.setHex(Number(profile.coreHex) || 0xfff0a0);
    GNAT_COLOR_TMP.copy(baseColor)
      .lerp(GNAT_COLOR_FIRE_TMP, Math.min(1, tintMix * Math.max(0.2, burning.intensity)))
      .lerp(GNAT_COLOR_FIRE_CORE, Math.min(0.75, coreMix));
    mesh.setColorAt(i, GNAT_COLOR_TMP);
  }

  function addBurnCardForState(state = null, runtimePosition = null, nowSec = 0, { dead = false } = {}) {
    if (!state || !runtimePosition) return;
    const burning = resolveBurningRuntimeState(state, nowSec);
    if (!burning.active) return;
    if (burnVisualDiagnostics.hideCards) return;
    const x = Number(runtimePosition.x) || 0;
    const y = Number(runtimePosition.y) || 0;
    const z = (Number(runtimePosition.z) || 0) + 6;
    const boPx = Math.max(1, Number(getBo()) || 1);
    fireCards.addTeardrop({
      x,
      y,
      z,
      widthPx: boPx * 0.05,
      heightPx: boPx * 0.20,
      seed: Number(state.burnVisualSeed) || Number(state.phaseX) || 0,
    });
  }

  function startBurnAfterGround(state = null, nowSec = 0) {
    if (!state || !state.burnDeathActive || state.burnGroundedSec) return;
    const afterburnSec = randomInRange(GNAT_BURN_AFTER_GROUND_RANGE_SEC, 2.2);
    state.burnGroundedSec = nowSec;
    state.burnAfterDeathUntilSec = nowSec + afterburnSec;
    state.burnVisualUntilSec = Math.max(Number(state.burnVisualUntilSec) || 0, state.burnAfterDeathUntilSec);
    state.deathHideSec = Math.max(Number(state.deathHideSec) || 0, state.burnAfterDeathUntilSec + GNAT_BURN_HIDE_BUFFER_SEC);
  }

  function hideStateInstance(i = 0) {
    positionVec.set(0, 0, -100000);
    quat.identity();
    matrix.compose(positionVec, quat, ZERO_SCALE_VEC);
    mesh.setMatrixAt(i, matrix);
  }

  function updateDeathInstance(state, i = 0, nowSec = 0, dtSec = 0) {
    if (!state || !mesh) return;
    if (!state.deathStartedSec) startDeath(state, nowSec);
    if (nowSec >= (Number(state.deathHideSec) || 0)) {
      hideStateInstance(i);
      return;
    }
    state.velocity.xW *= Math.max(0, 1 - (dtSec * 1.8));
    state.velocity.yW += state.stunGravityPxPerSec2 * dtSec;
    state.velocity.yW *= Math.max(0, 1 - (dtSec * 0.18));
    const speed = Math.hypot(state.velocity.xW, state.velocity.yW);
    const maxSpeed = Math.max(state.speedPx * 0.35, state.stunGravityPxPerSec2 * 0.75);
    if (speed > maxSpeed) {
      state.velocity.xW *= maxSpeed / speed;
      state.velocity.yW *= maxSpeed / speed;
    }
    const next = {
      xW: state.position.xW + state.velocity.xW * dtSec,
      yW: state.position.yW + state.velocity.yW * dtSec,
    };
    if (physicsPointInBounds(next, bounds)) {
      state.position = clampToBox(next, bounds.box);
      state.lastValidPosition = copyPoint(state.position);
    } else {
      startBurnAfterGround(state, nowSec);
      state.position = state.lastValidPosition
        ? copyPoint(state.lastValidPosition)
        : clampToBox(state.position, bounds.box);
      state.velocity.xW *= 0.18;
      if (state.stunBounceRemaining > 0) {
        const bounceSpeed = Math.abs(state.velocity.yW) * 0.16;
        const bounceAngle = randomUnit() * GNAT_STUN_BOUNCE_ANGLE_RAD;
        state.velocity.xW += Math.sin(bounceAngle) * bounceSpeed;
        state.velocity.yW = -Math.cos(bounceAngle) * bounceSpeed;
        state.stunBounceRemaining -= 1;
      } else {
        state.velocity.yW = 0;
      }
    }
    state.spin.x += state.spinSpeed.x * dtSec;
    state.spin.y += state.spinSpeed.y * dtSec;
    state.spin.z += state.spinSpeed.z * dtSec;
    const runtimePosition = toRuntimePosition({
      xW: state.position.xW,
      yW: state.position.yW,
      z: state.zDepthPx,
    });
    positionVec.set(runtimePosition.x, runtimePosition.y, runtimePosition.z);
    quat.setFromEuler(state.spin);
    scaleVec.set(state.scale, state.scale * 0.55, state.scale);
    matrix.compose(positionVec, quat, scaleVec);
    mesh.setMatrixAt(i, matrix);
    const fadeT = Math.max(0, Math.min(1, (nowSec - state.deathStartedSec) / GNAT_DEATH_FADE_SEC));
    GNAT_COLOR_BURNING.copy(GNAT_COLOR_NEUTRAL).lerp(GNAT_COLOR_DEAD, fadeT);
    setGnatInstanceColor(i, GNAT_COLOR_BURNING, state, nowSec, { dead: true });
    addBurnCardForState(state, runtimePosition, nowSec, { dead: true });
  }

  function update(nowMs = performance.now(), dtSec = 0.016, {
    orbWorldPosition = null,
    orbRuntimePosition = null,
    orbAlive = true,
    orbCombat = null,
    camera = null,
  } = {}) {
    if (!mesh || !states.length) return;
    const nowSec = nowMs / 1000;
    const orbPosition = orbAlive && orbWorldPosition && Number.isFinite(Number(orbWorldPosition.xW)) && Number.isFinite(Number(orbWorldPosition.yW))
      ? { xW: Number(orbWorldPosition.xW), yW: Number(orbWorldPosition.yW) }
      : null;
    const orbRuntime = orbAlive && orbRuntimePosition && Number.isFinite(Number(orbRuntimePosition.x)) && Number.isFinite(Number(orbRuntimePosition.y))
      ? {
          x: Number(orbRuntimePosition.x),
          y: Number(orbRuntimePosition.y),
          z: Number.isFinite(Number(orbRuntimePosition.z)) ? Number(orbRuntimePosition.z) : null,
        }
      : null;
    const orbProjected = orbPosition && orbRuntime
      ? toRuntimePosition({ xW: orbPosition.xW, yW: orbPosition.yW, z: orbRuntime.z || 0 })
      : null;
    const orbImmune = !!(orbCombat && orbCombat.immune);
    const orbVisualOffset = orbProjected && orbRuntime
      ? {
          x: orbRuntime.x - (Number(orbProjected.x) || 0),
          y: orbRuntime.y - (Number(orbProjected.y) || 0),
          z: orbRuntime.z == null ? 0 : orbRuntime.z - (Number(orbProjected.z) || 0),
        }
      : null;
    const signalCount = compactActiveSignals(nowSec);
    pathDistanceCache.clear();
    let directAlerts = 0;
    let relayedAlerts = 0;
    let feedingCount = 0;
    let stunnedCount = 0;
    let burningCount = 0;
    let deadBurningCount = 0;
    let activeLiftLeach = 0;
    let activeLifeLeachPerSec = 0;
    fireCards.beginFrame(nowSec, { camera });
    for (let i = 0; i < states.length; i += 1) {
      const state = states[i];
      applyPeriodicFireDamage(state, nowSec, dtSec);
      if (!state) {
        hideStateInstance(i);
        continue;
      }
      if (state.hp <= 0) {
        if (resolveBurningRuntimeState(state, nowSec).active) deadBurningCount += 1;
        updateDeathInstance(state, i, nowSec, dtSec);
        continue;
      }
      if (resolveBurningRuntimeState(state, nowSec).active) burningCount += 1;
      if (state.mode === "stunned") {
        if (nowSec >= state.stunUntilSec) {
          if (typeof onCombatEvent === "function") {
            onCombatEvent("combat.stun_recovered", {
              targetEntityId: `enemy:gnat-swarm:${state.index}`,
              atMs: nowMs,
            });
          }
          if (!physicsPointInBounds(state.position, bounds) && state.lastValidPosition) {
            state.position = copyPoint(state.lastValidPosition);
          }
          startReturn(state, nowSec);
        } else {
          stunnedCount += 1;
          state.target = state.position;
        }
      }
      if (orbPosition && state.mode !== "alerted" && state.mode !== "feeding" && state.mode !== "stunned" && nowSec >= state.nextDetectAt) {
        state.nextDetectAt = nowSec + state.detectionCheckSec;
        const detectionDistance = distance(state.position, orbPosition);
        const chance = shapedProximityChance({
          distancePx: detectionDistance,
          radiusPx: state.detectionRadiusPx,
          baseChance: state.detectionBaseChance,
          awareness: state.awareness,
          strength: 1,
        });
        if (chance > 0 && Math.random() < chance) {
          directAlerts += 1;
          startAlert(state, orbPosition, nowSec, { strength: 1, generation: 0, source: "direct" });
        }
      }
      if (orbPosition && state.mode !== "alerted" && state.mode !== "feeding" && state.mode !== "stunned" && nowSec >= state.nextSignalCheckAt) {
        state.nextSignalCheckAt = nowSec + state.signalCheckSec;
        for (let signalIndex = 0; signalIndex < signalCount; signalIndex += 1) {
          const signal = activeSignals[signalIndex];
          if (!signal || signal.sourceIndex === state.index || signal.generation >= state.signalHops || signal.strength < state.minSignalStrength) continue;
          const signalDistance = distance(state.position, signal.position);
          const chance = shapedProximityChance({
            distancePx: signalDistance,
            radiusPx: state.signalRadiusPx,
            baseChance: state.signalBaseChance,
            awareness: state.awareness,
            strength: signal.strength,
          });
	          if (chance > 0 && Math.random() < chance) {
	            relayedAlerts += 1;
	            state.signalFlashUntil = Math.max(state.signalFlashUntil || 0, nowSec + GNAT_SIGNAL_FLASH_SEC);
	            startAlert(state, signal.orbPosition || orbPosition, nowSec, {
              strength: signal.strength * state.signalDecay,
              generation: signal.generation + 1,
              source: "relay",
            });
            break;
          }
        }
      }
      if (orbPosition && (state.mode === "alerted" || state.mode === "feeding") && nowSec >= state.nextRelayAt) {
        const nextStrength = Math.max(state.minSignalStrength, state.alertStrength || 1) * state.signalDecay;
        emitSignal(state, nowSec, nextStrength, (state.alertGeneration || 0) + 1);
        state.nextRelayAt = nowSec + state.signalCooldownSec;
      }
      if (orbPosition && (state.mode === "alerted" || state.mode === "feeding") && nowSec >= state.nextLeashCheckAt) {
        state.nextLeashCheckAt = nowSec + 0.25 + Math.random() * 0.25;
        const leashLimitPx = state.mode === "feeding" ? state.leashFeedPx : state.leashChasePx;
        const leashFrom = state.mode === "feeding" ? state.spawn : state.position;
        const leashDistance = estimateCachedPathDistance(leashFrom, orbPosition, state.leashPathStepPx, pathDistanceCache);
        if (leashLimitPx > 0 && leashDistance > leashLimitPx) {
          state.velocity.xW *= 0.35;
          state.velocity.yW *= 0.35;
          startReturn(state, nowSec);
        }
      }
      if (state.mode === "idle" && nowSec >= state.nextTargetAt) {
        scheduleIdleTarget(state, nowSec);
      }
      if (state.mode === "cooldown" && nowSec >= state.nextRouteAt) {
        state.mode = "idle";
        scheduleIdleTarget(state, nowSec);
      }
      if (state.mode === "idle" && state.wanderChancePerSec > 0 && Math.random() < state.wanderChancePerSec * dtSec) {
        startWander(state, nowSec);
      }
      if (orbPosition && state.mode === "alerted" && nowSec >= state.nextTargetAt) {
        scheduleAlertTarget(state, orbPosition, nowSec);
      }
      if (state.mode === "outbound" && nowSec >= state.nextTargetAt) {
        scheduleWanderTarget(state, nowSec);
      }
      if (state.mode === "return" && nowSec >= state.nextTargetAt) {
        scheduleWanderTarget(state, nowSec);
      }
      if (state.mode === "linger" && nowSec >= state.nextTargetAt) {
        scheduleWanderTarget(state, nowSec);
      }
      if (state.mode === "outbound" && (state.isDwelling || distance(state.position, state.route[state.routeIndex] || state.destination) < state.arrivalRadiusPx)) {
        advanceRoute(state, nowSec, () => {
          state.mode = "linger";
          state.lingerUntil = nowSec + state.lingerSec;
          scheduleWanderTarget(state, nowSec);
        });
      }
      if (state.mode === "linger" && nowSec >= state.lingerUntil) {
        startReturn(state, nowSec);
      }
      if (state.mode === "return" && (state.isDwelling || distance(state.position, state.route[state.routeIndex] || state.spawn) < Math.max(state.arrivalRadiusPx, state.spawnRadiusPx * 0.34))) {
        advanceRoute(state, nowSec, () => startCooldown(state, nowSec));
      }
      if (orbPosition && state.mode === "alerted") {
        const feedOuterRadiusPx = resolveFeedOuterRadiusPx(state, orbCombat);
        if (distance(state.position, orbPosition) <= Math.max(state.arrivalRadiusPx, feedOuterRadiusPx)) {
          startFeeding(state, orbPosition, nowSec);
        } else if (distance(state.position, state.route[state.routeIndex] || state.orbTarget || orbPosition) < Math.max(state.arrivalRadiusPx, state.scale * 1.5)) {
          state.routeIndex += 1;
          if (state.routeIndex >= state.route.length) scheduleAlertTarget(state, orbPosition, nowSec);
          else state.target = state.route[state.routeIndex];
        }
      }
      if (orbPosition && state.mode === "feeding") {
        feedingCount += 1;
        if (!orbImmune) {
          activeLiftLeach += state.liftLeach;
          activeLifeLeachPerSec += state.lifeLeachPerSec;
        }
        state.lastFeedDt = dtSec;
        if (nowSec >= state.nextTargetAt) scheduleFeedTarget(state, orbPosition, nowSec, orbCombat);
      }
      const feedJitterScale = state.mode === "feeding" ? 0.08 : (state.mode === "stunned" ? 0.02 : 1);
      const jitterX = (Math.sin(nowSec * state.elasticJitterHz * 6.283 + state.phaseX) * state.elasticJitterPx + randomUnit() * state.targetJitterPx) * feedJitterScale;
      const jitterY = (Math.cos(nowSec * state.elasticJitterHz * 5.113 + state.phaseY) * state.elasticJitterPx + randomUnit() * state.targetJitterPx) * feedJitterScale;
      const tx = (state.target.xW || 0) + jitterX;
      const ty = (state.target.yW || 0) + jitterY;
      const dx = tx - (state.position.xW || 0);
      const dy = ty - (state.position.yW || 0);
      if (state.mode === "stunned") {
        state.velocity.xW *= Math.max(0, 1 - (dtSec * 1.8));
        state.velocity.yW += state.stunGravityPxPerSec2 * dtSec;
        state.velocity.yW *= Math.max(0, 1 - (dtSec * 0.18));
      } else {
        const modeStiffness = state.mode === "feeding" ? Math.max(state.stiffness * 5.6, 82) : state.stiffness;
        const modeDamping = state.mode === "feeding" ? Math.max(state.damping * 2.8, 28) : state.damping;
        state.velocity.xW += dx * modeStiffness * dtSec - state.velocity.xW * modeDamping * dtSec;
        state.velocity.yW += dy * modeStiffness * dtSec - state.velocity.yW * modeDamping * dtSec;
      }
      const modeSpeedMultiplier = state.mode === "return"
        ? state.returnSpeedMultiplier
        : (state.mode === "alerted" ? state.alertSpeedMultiplier : 1);
      const speed = Math.hypot(state.velocity.xW, state.velocity.yW);
      const maxSpeed = state.mode === "stunned"
        ? Math.max(state.speedPx * 0.35, state.stunGravityPxPerSec2 * 0.75)
        : state.mode === "feeding"
        ? Math.max(state.speedPx * 0.72, (state.feedBandPx + state.feedNipDepthPx) * 12)
        : state.speedPx * modeSpeedMultiplier;
      if (speed > maxSpeed) {
        state.velocity.xW *= maxSpeed / speed;
        state.velocity.yW *= maxSpeed / speed;
      }
      const next = {
        xW: state.position.xW + state.velocity.xW * dtSec,
        yW: state.position.yW + state.velocity.yW * dtSec,
      };
      let resolvedNext = orbPosition && (state.mode === "alerted" || state.mode === "feeding")
        ? resolveOrbContact(state, next, orbPosition, orbCombat)
        : next;
      if (state.mode === "feeding" && state.target) {
        const stickiness = Math.max(0, Math.min(1, state.feedStickiness));
        resolvedNext = {
          xW: resolvedNext.xW + (state.target.xW - resolvedNext.xW) * stickiness,
          yW: resolvedNext.yW + (state.target.yW - resolvedNext.yW) * stickiness,
        };
      }
      if (state.mode === "stunned" && physicsPointInBounds(resolvedNext, bounds)) {
        state.position = clampToBox(resolvedNext, bounds.box);
        state.lastValidPosition = copyPoint(state.position);
      } else if (state.mode === "stunned") {
        state.position = state.lastValidPosition
          ? copyPoint(state.lastValidPosition)
          : clampToBox(state.position, bounds.box);
        state.target = state.position;
        state.velocity.xW *= 0.18;
        if (state.stunBounceRemaining > 0) {
          const bounceSpeed = Math.abs(state.velocity.yW) * 0.16;
          const bounceAngle = randomUnit() * GNAT_STUN_BOUNCE_ANGLE_RAD;
          state.velocity.xW += Math.sin(bounceAngle) * bounceSpeed;
          state.velocity.yW = -Math.cos(bounceAngle) * bounceSpeed;
          state.stunBounceRemaining -= 1;
        } else {
          state.velocity.yW = 0;
        }
      } else if (boundedPointContains(resolvedNext, bounds)) {
        state.position = clampToBox(resolvedNext, bounds.box);
        state.lastValidPosition = copyPoint(state.position);
      } else {
        state.position = resolveBoundedPoint(resolvedNext, {
          fallback: state.position,
          loops: bounds.loops,
          box: bounds.box,
          nav: bounds.nav,
        });
        if (boundedPointContains(state.position, bounds)) {
          state.lastValidPosition = copyPoint(state.position);
        }
        state.velocity.xW *= -0.25;
        state.velocity.yW *= -0.25;
        startReturn(state, nowSec);
      }
      state.spin.x += state.spinSpeed.x * dtSec;
      state.spin.y += state.spinSpeed.y * dtSec;
      state.spin.z += state.spinSpeed.z * dtSec;
      const runtimePosition = toRuntimePosition({
        xW: state.position.xW,
        yW: state.position.yW,
        z: state.zDepthPx,
      });
      if (orbVisualOffset && (state.mode === "alerted" || state.mode === "feeding")) {
        runtimePosition.x += orbVisualOffset.x;
        runtimePosition.y += orbVisualOffset.y;
      }
      if (orbRuntime && orbRuntime.z != null && (state.mode === "alerted" || state.mode === "feeding")) {
        runtimePosition.z = orbRuntime.z;
      }
      positionVec.set(runtimePosition.x, runtimePosition.y, runtimePosition.z);
      quat.setFromEuler(state.spin);
      scaleVec.set(state.scale, state.scale * 0.55, state.scale);
	      matrix.compose(positionVec, quat, scaleVec);
	      mesh.setMatrixAt(i, matrix);
      if (shouldShowSignalBlink(state, nowSec)) {
        setGnatInstanceColor(i, GNAT_COLOR_SIGNAL, state, nowSec);
      } else if (state.mode === "alerted" || state.mode === "feeding") {
        setGnatInstanceColor(i, GNAT_COLOR_ALERTED, state, nowSec);
      } else {
        setGnatInstanceColor(i, GNAT_COLOR_NEUTRAL, state, nowSec);
      }
      addBurnCardForState(state, runtimePosition, nowSec);
	    }
	    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    fireCards.endFrame();
    emitFeedingCombat({ nowMs, dtSec, feedingCount, activeLiftLeach, activeLifeLeachPerSec });
    Object.assign(alertTrace, {
      direct: directAlerts,
      relayed: relayedAlerts,
      feeding: feedingCount,
      stunned: stunnedCount,
      burning: burningCount,
      deadBurning: deadBurningCount,
      burnVisualDiagnostics,
      fireCards: fireCards.activeCount,
      fireCardTrace: fireCards.getTrace(),
      liftLeach: activeLiftLeach,
      lifeLeachPerSec: activeLifeLeachPerSec,
      shieldImmune: orbImmune,
      shieldContactRadiusPx: Math.max(0, Number(orbCombat && orbCombat.radiusWorldUnits) || Number(orbCombat && orbCombat.contactRadiusPx) || 0),
      signals: activeSignals.length,
      nav: !!bounds.nav,
      navCells: bounds.nav ? (bounds.nav.cols || 0) * (bounds.nav.rows || 0) : 0,
      navResolutionBo: bounds.nav ? bounds.nav.resolutionBo : null,
    });
  }

  function getTrace(camera = null) {
    return Object.freeze({
      ...alertTrace,
      fireCardTrace: fireCards.getTrace(camera),
    });
  }

  return Object.freeze({
    load,
    update,
    releaseOrbTargets,
    applyCombatEffect,
    hasActiveVisuals: () => states.length > 0,
    getTrace,
    clear: disposeMesh,
    dispose() {
      disposeMesh();
      fireCards.dispose();
      geometry.dispose();
      material.dispose();
    },
  });
}
