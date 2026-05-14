import * as THREE from "three";

function clampNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function rangePair(range = [], fallback = [0, 1]) {
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

function randomUnit() {
  return Math.random() * 2 - 1;
}

function distance(a, b) {
  return Math.hypot((a.xW || 0) - (b.xW || 0), (a.yW || 0) - (b.yW || 0));
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

  function disposeMesh() {
    if (mesh) {
      root.remove(mesh);
      mesh = null;
    }
    states = [];
  }

  function chooseDestination(state) {
    return randomBoundedPointAround(state.spawn, state.wanderRangePx, bounds);
  }

  function startRoute(state, nowSec = 0) {
    const destination = chooseDestination(state);
    state.route = buildRouteSegments({
      from: state.position,
      to: destination,
      spacingPx: randomInRange(state.segmentSpacingPx, 96),
      jitterPx: state.segmentJitterPx,
      bounds,
    });
    state.routeIndex = 0;
    state.target = state.route[0] || destination;
    state.nextRouteAt = nowSec + randomInRange(state.cooldownSec, 4);
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
    const personality = gnat.personalityRanges || {};
    const countPerSpawn = Math.max(1, Math.round(clampNumber(swarm.gnatsTotal, 24, 1, 240)));
    const bo = Math.max(1, Number(getBo()) || 42);
    const baseSpeed = rangePair(swarm.baseSpeedBoPerSec, [1.35, 3.2]);
    const speedX = rangePair(personality.speed, [1, 1]);
    const wanderRangeBo = rangePair(personality.wanderRangeBo, [4, 8]);
    const segmentSpacingBo = rangePair(personality.wanderSegmentSpacingBo, [3, 7]);
    const segmentJitterBo = rangePair(personality.wanderSegmentJitterBo, [0.5, 2]);
    const cooldownSec = rangePair(personality.wanderCooldownSec, [1, 5]);
    const spawnRadius = Math.max(0, clampNumber(swarm.spawnRadiusBo, 2, 0, 64)) * bo;
    const gnatSize = Math.max(0.5, clampNumber(swarm.gnatSizeBo, 0.04, 0.005, 1) * bo);
    const allStates = [];
    for (const spawn of Array.isArray(spawns) ? spawns : []) {
      if (String(spawn && (spawn.enemy || spawn.archetype) || "") !== "gnat-swarm") continue;
      const center = spawn && spawn.worldCenter ? spawn.worldCenter : null;
      if (!center) continue;
      for (let i = 0; i < countPerSpawn; i += 1) {
        const spawnPoint = randomBoundedPointAround(center, spawnRadius, bounds);
        const state = {
          position: spawnPoint,
          spawn: center,
          target: spawnPoint,
          velocity: { xW: randomUnit() * 20, yW: randomUnit() * 20 },
          route: [],
          routeIndex: 0,
          nextRouteAt: Math.random() * 2,
          speedPx: Math.max(1, randomInRange(baseSpeed, 2) * randomInRange(speedX, 1) * bo),
          wanderRangePx: Math.max(spawnRadius, randomInRange(wanderRangeBo, 8) * bo),
          segmentSpacingPx: [segmentSpacingBo[0] * bo, segmentSpacingBo[1] * bo],
          segmentJitterPx: randomInRange(segmentJitterBo, 1) * bo,
          cooldownSec,
          spin: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          spinSpeed: {
            x: randomUnit() * 5,
            y: randomUnit() * 7,
            z: randomUnit() * 6,
          },
          scale: gnatSize * (0.75 + Math.random() * 0.7),
        };
        startRoute(state, 0);
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

  function update(nowMs = performance.now(), dtSec = 0.016) {
    if (!mesh || !states.length) return;
    const nowSec = nowMs / 1000;
    const z = -Math.max(0, clampNumber(getOrbZBO(), 4)) * Math.max(1, Number(getBo()) || 42);
    for (let i = 0; i < states.length; i += 1) {
      const state = states[i];
      if (nowSec >= state.nextRouteAt || distance(state.position, state.target) < Math.max(8, state.scale * 1.5)) {
        state.routeIndex += 1;
        if (state.routeIndex >= state.route.length) startRoute(state, nowSec);
        else state.target = state.route[state.routeIndex];
      }
      const dx = (state.target.xW || 0) - (state.position.xW || 0);
      const dy = (state.target.yW || 0) - (state.position.yW || 0);
      const d = Math.max(0.001, Math.hypot(dx, dy));
      const accel = state.speedPx * 5;
      state.velocity.xW += (dx / d) * accel * dtSec;
      state.velocity.yW += (dy / d) * accel * dtSec;
      const speed = Math.hypot(state.velocity.xW, state.velocity.yW);
      if (speed > state.speedPx) {
        state.velocity.xW *= state.speedPx / speed;
        state.velocity.yW *= state.speedPx / speed;
      }
      const next = {
        xW: state.position.xW + state.velocity.xW * dtSec,
        yW: state.position.yW + state.velocity.yW * dtSec,
      };
      if (pointInBounds(next, bounds.loops)) {
        state.position = clampToBox(next, bounds.box);
      } else {
        state.position = resolveBoundedPoint(next, {
          fallback: state.position,
          loops: bounds.loops,
          box: bounds.box,
        });
        state.velocity.xW *= -0.25;
        state.velocity.yW *= -0.25;
        startRoute(state, nowSec);
      }
      state.spin.x += state.spinSpeed.x * dtSec;
      state.spin.y += state.spinSpeed.y * dtSec;
      state.spin.z += state.spinSpeed.z * dtSec;
      const runtimePosition = toRuntimePosition({
        xW: state.position.xW,
        yW: state.position.yW,
        z,
      });
      positionVec.set(runtimePosition.x, runtimePosition.y, runtimePosition.z);
      quat.setFromEuler(state.spin);
      scaleVec.set(state.scale, state.scale * 0.55, state.scale);
      matrix.compose(positionVec, quat, scaleVec);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return Object.freeze({
    load,
    update,
    hasActiveVisuals: () => states.length > 0,
    clear: disposeMesh,
    dispose() {
      disposeMesh();
      geometry.dispose();
      material.dispose();
    },
  });
}
