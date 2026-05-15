import * as THREE from "three";

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

function curveUnitValue(t = 0, curve = null) {
  const linear = Math.min(1, Math.max(0, Number(t) || 0));
  const bias = clampNumber(curve && curve.bias, 0, -1, 1);
  const amount = clampNumber(curve && curve.amount, 0, 0, 1);
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

function randomPointAround(center = {}, radius = 1) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * Math.max(0, radius);
  return {
    xW: clampNumber(center.xW, 0) + Math.cos(angle) * r,
    yW: clampNumber(center.yW, 0) + Math.sin(angle) * r,
  };
}

function resolveBoundedPoint(point = {}, {
  fallback = null,
  loops = [],
  box = null,
} = {}) {
  const clamped = clampToBox(point, box);
  if (pointInBounds(clamped, loops)) return clamped;
  return fallback ? clampToBox(fallback, box) : clamped;
}

function randomBoundedPointAround(center = {}, radius = 1, bounds = {}) {
  for (let i = 0; i < 24; i += 1) {
    const candidate = clampToBox(randomPointAround(center, radius), bounds.box);
    if (pointInBounds(candidate, bounds.loops)) return candidate;
  }
  return resolveBoundedPoint(center, { fallback: center, loops: bounds.loops, box: bounds.box });
}

function buildRouteSegments({ from, to, spacingPx = 80, jitterPx = 0, bounds = {} } = {}) {
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
    }));
  }
  segments[segments.length - 1] = resolveBoundedPoint(to, {
    fallback: segments[segments.length - 2] || from,
    loops: bounds.loops,
    box: bounds.box,
  });
  return segments;
}

export function createGnatSwarm3dRuntime({
  group = null,
  toRuntimePosition = ({ xW = 0, yW = 0, z = 0 } = {}) => ({ x: xW, y: yW, z }),
  getBo = () => 42,
  getOrbZBO = () => 4,
  getConfig = () => null,
  onNeedsFrame = null,
} = {}) {
  const root = group || new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xdfffcf,
    emissive: 0x9dff8a,
    emissiveIntensity: 1.4,
    roughness: 0.48,
    metalness: 0.08,
  });
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  let mesh = null;
  let states = [];
  let bounds = Object.freeze({ loops: [], box: null });
  let activeSignals = [];
  let alertTrace = Object.freeze({ direct: 0, relayed: 0, feeding: 0, signals: 0 });

  function disposeMesh() {
    if (mesh) {
      root.remove(mesh);
      mesh = null;
    }
    states = [];
    activeSignals = [];
    alertTrace = Object.freeze({ direct: 0, relayed: 0, feeding: 0, signals: 0 });
  }

  function chooseDestination(state) {
    return randomBoundedPointAround(state.spawn, state.wanderRangePx, bounds);
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
    state.destination = state.spawn;
    state.isDwelling = false;
    state.route = buildRouteSegments({
      from: state.position,
      to: state.spawn,
      spacingPx: randomInRange(state.segmentSpacingPx, 96) * Math.max(0.45, 1 - state.returnBias * 0.3),
      jitterPx: state.segmentJitterPx * Math.max(0.2, 1 - state.returnBias * 0.6),
      bounds,
    });
    state.routeIndex = 0;
    state.target = state.route[0] || state.spawn;
    scheduleWanderTarget(state, nowSec);
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
    if (!state || strength < state.minSignalStrength || generation > state.maxRelayGenerations) return;
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
    state.nextSignalCheckAt = nowSec + state.telegraphCheckSec;
    state.nextRelayAt = nowSec + state.telegraphCooldownSec;
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
    emitSignal(state, nowSec, Math.max(state.minSignalStrength, state.alertStrength * state.telegraphDecay), state.alertGeneration + 1);
  }

  function scheduleFeedTarget(state, orbPosition = null, nowSec = 0) {
    if (!state || !orbPosition) return;
    state.orbTarget = { xW: orbPosition.xW, yW: orbPosition.yW };
    if (nowSec >= state.nextFeedMigrationAt) {
      state.feedMigrationDirection = Math.random() < 0.5 ? -1 : 1;
      state.nextFeedMigrationAt = nowSec + randomInRange(state.feedMigrationRetargetSec, 3.5);
    }
    state.feedLatchAngle += state.feedMigrationDirection * state.feedMigrationRadPerSec * Math.max(0.001, state.lastFeedDt || 0.016);
    state.feedLatchAngle += state.feedOrbitSpeed * Math.max(0.001, state.lastFeedDt || 0.016);
    state.feedAngle = state.feedLatchAngle;
    const pulse = (Math.sin(nowSec * state.feedNipHz * Math.PI * 2 + state.feedPhase) + 1) * 0.5;
    const nipOffsetPx = (pulse * pulse) * state.feedNipDepthPx;
    const twitchPx = randomUnit() * state.feedNipDepthPx * 0.18;
    const targetRadiusPx = state.feedContactRadiusPx + Math.max(0, nipOffsetPx + twitchPx);
    state.target = {
      xW: state.orbTarget.xW + Math.cos(state.feedAngle) * targetRadiusPx,
      yW: state.orbTarget.yW + Math.sin(state.feedAngle) * targetRadiusPx,
    };
    state.nextTargetAt = nowSec + 0.035 + Math.random() * 0.045;
  }

  function resolveOrbContact(state, next = null, orbPosition = null) {
    if (!state || !next || !orbPosition) return next;
    const dx = next.xW - orbPosition.xW;
    const dy = next.yW - orbPosition.yW;
    const d = Math.hypot(dx, dy);
    if (d >= state.feedContactRadiusPx && (state.mode !== "feeding" || d <= state.feedOuterRadiusPx)) return next;
    const normal = normalFromPoints(orbPosition, next, state.feedAngle);
    const targetRadiusPx = state.mode === "feeding"
      ? clampNumber(d, state.feedContactRadiusPx, state.feedContactRadiusPx, state.feedOuterRadiusPx)
      : state.feedContactRadiusPx;
    const projected = {
      xW: orbPosition.xW + normal.xW * targetRadiusPx,
      yW: orbPosition.yW + normal.yW * targetRadiusPx,
    };
    const inwardSpeed = state.velocity.xW * normal.xW + state.velocity.yW * normal.yW;
    if (inwardSpeed < 0) {
      state.velocity.xW -= (1 + state.feedBounce) * inwardSpeed * normal.xW;
      state.velocity.yW -= (1 + state.feedBounce) * inwardSpeed * normal.yW;
    }
    if (state.mode === "feeding" && d > state.feedOuterRadiusPx) {
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
  } = {}) {
    disposeMesh();
    bounds = Object.freeze({
      loops: Array.isArray(boundaryLoops) ? boundaryLoops : [],
      box: boundaryBox || null,
    });
    const config = getConfig() || {};
    const swarm = config.swarm || {};
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
    const arrivalRadiusBo = rangePair(personality.arrivalRadiusBo, [0.34, 0.34]);
    const returnSpeedMultiplier = rangePair(personality.returnSpeedMultiplier, [1.12, 1.12]);
    const spawnRadius = Math.max(0, clampNumber(swarm.spawnRadiusBo, 2, 0, 64)) * bo;
    const gnatSize = Math.max(0.5, clampNumber(swarm.gnatSizeBo, 0.04, 0.005, 1) * bo);
    const zDepthPx = -clampNumber(swarm.zDepthBo, getOrbZBO(), -500, 500) * bo;
    const detectionRadiusPx = Math.max(0, clampNumber(swarm.detectionRadiusBo, 10, 0, 240) * bo);
    const detectionBaseChance = normalizeUnit(swarm.detectionBaseChance, 0.35);
    const detectionCheckSec = Math.max(0.1, clampNumber(swarm.detectionCheckSec, 1, 0.1, 60));
    const telegraphRadiusPx = Math.max(0, clampNumber(swarm.telegraphRadiusBo, 14, 0, 320) * bo);
    const telegraphBaseChance = normalizeUnit(swarm.telegraphBaseChance, 0.42);
    const telegraphDecay = normalizeUnit(swarm.telegraphDecay, 0.72);
    const telegraphCooldownSec = Math.max(0.1, clampNumber(swarm.telegraphCooldownSec, 1, 0.1, 60));
    const maxRelayGenerations = Math.max(0, Math.round(clampNumber(swarm.maxRelayGenerations, 5, 0, 24)));
    const minSignalStrength = normalizeUnit(swarm.minSignalStrength, 0.08);
    const signalMemorySec = Math.max(0.1, clampNumber(swarm.signalMemorySec, 1.6, 0.1, 60));
    const feedOffsetPx = clampNumber(swarm.feedOffsetBo, 0.08, -4, 12) * bo;
    const feedNipDepthPx = Math.max(0, clampNumber(swarm.feedNipDepthBo, 0.24, 0, 4) * bo);
    const feedNipHz = Math.max(0, clampNumber(swarm.feedNipHz, 7, 0, 40));
    const feedStickiness = normalizeUnit(swarm.feedStickiness, 0.42);
    const feedMigrationPxPerSec = Math.max(0, clampNumber(swarm.feedMigrationBoPerSec, 0.5, 0, 12) * bo);
    const feedMigrationRetargetSec = rangePair(swarm.feedMigrationRetargetSec, [1, 6]);
    const awarenessRange = rangePair(personality.awareness, [0.5, 1]);
    const aggressionRange = rangePair(personality.aggression, [0.2, 0.6]);
    const allStates = [];
    for (const spawn of Array.isArray(spawns) ? spawns : []) {
      if (String(spawn && (spawn.enemy || spawn.archetype) || "") !== "gnat-swarm") continue;
      const center = spawn && spawn.worldCenter ? spawn.worldCenter : null;
      if (!center) continue;
      for (let i = 0; i < countPerSpawn; i += 1) {
        const spawnPoint = randomBoundedPointAround(center, spawnRadius, bounds);
        const personalWanderRangeBo = randomInRangeWithCurve(
          wanderRangeBo,
          8,
          spawnCurves.wanderRangeBo,
        );
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
          nextRelayAt: Math.random() * telegraphCooldownSec,
          alertGeneration: 0,
          alertStrength: 0,
          alertSource: "",
          speedPx: Math.max(1, randomInRange(baseSpeed, 2) * randomInRange(speedX, 1) * bo),
          spawnRadiusPx: spawnRadius,
          wanderRangePx: Math.max(spawnRadius, personalWanderRangeBo * bo),
          wanderChancePerSec: Math.max(0, personalWanderChancePerMinute / 60),
          segmentSpacingPx: [segmentSpacingBo[0] * bo, segmentSpacingBo[1] * bo],
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
          detectionRadiusPx,
          detectionBaseChance,
          detectionCheckSec,
          telegraphRadiusPx,
          telegraphBaseChance,
          telegraphDecay,
          telegraphCooldownSec,
          telegraphCheckSec: detectionCheckSec,
          maxRelayGenerations,
          minSignalStrength,
          signalMemorySec,
          gnatRadiusPx: Math.max(0.5, gnatSize * 0.5),
          feedContactRadiusPx: Math.max(1, bo * 0.5 + gnatSize * 0.5 + Math.max(0, feedOffsetPx)),
          feedBandPx: Math.max(1, bo * 0.1),
          feedOuterRadiusPx: Math.max(1, bo * 0.5 + gnatSize * 0.5 + Math.max(0, feedOffsetPx)) + Math.max(1, bo * 0.1),
          feedBounce: 0.46,
          feedNipDepthPx,
          feedNipHz: feedNipHz * (0.85 + Math.random() * 0.3),
          feedStickiness,
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

  function update(nowMs = performance.now(), dtSec = 0.016, {
    orbWorldPosition = null,
    orbRuntimePosition = null,
  } = {}) {
    if (!mesh || !states.length) return;
    const nowSec = nowMs / 1000;
    const orbPosition = orbWorldPosition && Number.isFinite(Number(orbWorldPosition.xW)) && Number.isFinite(Number(orbWorldPosition.yW))
      ? { xW: Number(orbWorldPosition.xW), yW: Number(orbWorldPosition.yW) }
      : null;
    const orbRuntime = orbRuntimePosition && Number.isFinite(Number(orbRuntimePosition.x)) && Number.isFinite(Number(orbRuntimePosition.y))
      ? {
          x: Number(orbRuntimePosition.x),
          y: Number(orbRuntimePosition.y),
          z: Number.isFinite(Number(orbRuntimePosition.z)) ? Number(orbRuntimePosition.z) : null,
        }
      : null;
    const orbProjected = orbPosition && orbRuntime
      ? toRuntimePosition({ xW: orbPosition.xW, yW: orbPosition.yW, z: orbRuntime.z || 0 })
      : null;
    const orbVisualOffset = orbProjected && orbRuntime
      ? {
          x: orbRuntime.x - (Number(orbProjected.x) || 0),
          y: orbRuntime.y - (Number(orbProjected.y) || 0),
          z: orbRuntime.z == null ? 0 : orbRuntime.z - (Number(orbProjected.z) || 0),
        }
      : null;
    activeSignals = activeSignals.filter((signal) => signal && signal.expiresAt >= nowSec && signal.strength > 0);
    const signalsSnapshot = activeSignals.slice();
    let directAlerts = 0;
    let relayedAlerts = 0;
    let feedingCount = 0;
    for (let i = 0; i < states.length; i += 1) {
      const state = states[i];
      if (orbPosition && state.mode !== "alerted" && state.mode !== "feeding" && nowSec >= state.nextDetectAt) {
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
      if (orbPosition && state.mode !== "alerted" && state.mode !== "feeding" && nowSec >= state.nextSignalCheckAt) {
        state.nextSignalCheckAt = nowSec + state.telegraphCheckSec;
        for (const signal of signalsSnapshot) {
          if (!signal || signal.sourceIndex === state.index || signal.generation >= state.maxRelayGenerations || signal.strength < state.minSignalStrength) continue;
          const signalDistance = distance(state.position, signal.position);
          const chance = shapedProximityChance({
            distancePx: signalDistance,
            radiusPx: state.telegraphRadiusPx,
            baseChance: state.telegraphBaseChance,
            awareness: state.awareness,
            strength: signal.strength,
          });
          if (chance > 0 && Math.random() < chance) {
            relayedAlerts += 1;
            startAlert(state, signal.orbPosition || orbPosition, nowSec, {
              strength: signal.strength * state.telegraphDecay,
              generation: signal.generation + 1,
              source: "relay",
            });
            break;
          }
        }
      }
      if (orbPosition && (state.mode === "alerted" || state.mode === "feeding") && nowSec >= state.nextRelayAt) {
        const nextStrength = Math.max(state.minSignalStrength, state.alertStrength || 1) * state.telegraphDecay;
        emitSignal(state, nowSec, nextStrength, (state.alertGeneration || 0) + 1);
        state.nextRelayAt = nowSec + state.telegraphCooldownSec;
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
        if (distance(state.position, orbPosition) <= Math.max(state.arrivalRadiusPx, state.feedContactRadiusPx + state.feedBandPx)) {
          startFeeding(state, orbPosition, nowSec);
        } else if (distance(state.position, state.route[state.routeIndex] || state.orbTarget || orbPosition) < Math.max(state.arrivalRadiusPx, state.scale * 1.5)) {
          state.routeIndex += 1;
          if (state.routeIndex >= state.route.length) scheduleAlertTarget(state, orbPosition, nowSec);
          else state.target = state.route[state.routeIndex];
        }
      }
      if (orbPosition && state.mode === "feeding") {
        feedingCount += 1;
        state.lastFeedDt = dtSec;
        if (nowSec >= state.nextTargetAt) scheduleFeedTarget(state, orbPosition, nowSec);
      }
      const feedJitterScale = state.mode === "feeding" ? 0.08 : 1;
      const jitterX = (Math.sin(nowSec * state.elasticJitterHz * 6.283 + state.phaseX) * state.elasticJitterPx + randomUnit() * state.targetJitterPx) * feedJitterScale;
      const jitterY = (Math.cos(nowSec * state.elasticJitterHz * 5.113 + state.phaseY) * state.elasticJitterPx + randomUnit() * state.targetJitterPx) * feedJitterScale;
      const tx = (state.target.xW || 0) + jitterX;
      const ty = (state.target.yW || 0) + jitterY;
      const dx = tx - (state.position.xW || 0);
      const dy = ty - (state.position.yW || 0);
      const modeStiffness = state.mode === "feeding" ? Math.max(state.stiffness * 5.6, 82) : state.stiffness;
      const modeDamping = state.mode === "feeding" ? Math.max(state.damping * 2.8, 28) : state.damping;
      state.velocity.xW += dx * modeStiffness * dtSec - state.velocity.xW * modeDamping * dtSec;
      state.velocity.yW += dy * modeStiffness * dtSec - state.velocity.yW * modeDamping * dtSec;
      const modeSpeedMultiplier = state.mode === "return" ? state.returnSpeedMultiplier : 1;
      const speed = Math.hypot(state.velocity.xW, state.velocity.yW);
      const maxSpeed = state.mode === "feeding"
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
        ? resolveOrbContact(state, next, orbPosition)
        : next;
      if (state.mode === "feeding" && state.target) {
        const stickiness = Math.max(0, Math.min(1, state.feedStickiness));
        resolvedNext = {
          xW: resolvedNext.xW + (state.target.xW - resolvedNext.xW) * stickiness,
          yW: resolvedNext.yW + (state.target.yW - resolvedNext.yW) * stickiness,
        };
      }
      if (pointInBounds(resolvedNext, bounds.loops)) {
        state.position = clampToBox(resolvedNext, bounds.box);
      } else {
        state.position = resolveBoundedPoint(resolvedNext, {
          fallback: state.position,
          loops: bounds.loops,
          box: bounds.box,
        });
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
    }
    mesh.instanceMatrix.needsUpdate = true;
    alertTrace = Object.freeze({
      direct: directAlerts,
      relayed: relayedAlerts,
      feeding: feedingCount,
      signals: activeSignals.length,
    });
  }

  return Object.freeze({
    load,
    update,
    hasActiveVisuals: () => states.length > 0,
    getTrace: () => alertTrace,
    clear: disposeMesh,
    dispose() {
      disposeMesh();
      geometry.dispose();
      material.dispose();
    },
  });
}
