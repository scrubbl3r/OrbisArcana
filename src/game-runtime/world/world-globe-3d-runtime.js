import { disposeThreeObject } from "../rendering/three/three-object-utils.js";
import { resolveAuthoredRenderOrder } from "../level/authored-render-stack.js";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "./world-globe-3d-default.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readNumber(source, keys = [], fallback = 0) {
  const object = source && typeof source === "object" ? source : {};
  for (const key of keys) {
    const value = Number(object[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function createWorldGlobe3dRuntime({
  group = null,
  createGlobeObject = null,
  resolveSpawnAnchor = () => ({ x: 0, y: 0 }),
  toRuntimePosition = ({ x = 0, y = 0 } = {}) => ({ x, y, z: 0 }),
  getBo = () => 72,
  getConfig = () => WORLD_GLOBE_3D_VISUAL_DEFAULTS,
  now = () => performance.now(),
  onSpawnCountChange = () => {},
  onActiveCountChange = () => {},
  onNeedsFrame = () => {},
} = {}) {
  const state = {
    pickups: [],
    map: new Map(),
  };
  let lastActiveCount = null;

  function currentBo() {
    return Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
  }

  function currentConfig() {
    const config = typeof getConfig === "function" ? getConfig() : null;
    return config && typeof config === "object" ? config : WORLD_GLOBE_3D_VISUAL_DEFAULTS;
  }

  function publishSpawnCount(count = state.pickups.length) {
    if (typeof onSpawnCountChange === "function") onSpawnCountChange(Math.max(0, Number(count) || 0));
  }

  function publishActiveCount() {
    const count = state.pickups.filter((pickup) => pickup && pickup.active).length;
    if (count === lastActiveCount) return;
    lastActiveCount = count;
    if (typeof onActiveCountChange === "function") onActiveCountChange(count);
  }

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function removePickup(pickup) {
    if (!pickup) return;
    if (pickup.model) {
      if (group && typeof group.remove === "function") group.remove(pickup.model);
      disposeThreeObject(pickup.model);
    }
  }

  function makePickup(spawn = {}, index = 0) {
    const emitterId = String((spawn && spawn.id) || `globe_emitter_${String(index + 1).padStart(2, "0")}`);
    const globeId = `${emitterId}.globe.1`;
    const config = currentConfig();
    const idle = config.idle || {};
    const baseOrb = currentBo();
    const bo = baseOrb * Math.max(0.01, readNumber(idle, ["diameterBO", "diameterRatio"], 0.35));
    const renderOrder = resolveAuthoredRenderOrder(spawn, { fallback: 40, offset: 0.7 });
    const model = typeof createGlobeObject === "function"
      ? createGlobeObject({
        bo,
        materialConfig: config.material,
        name: `world_globe3d:${globeId}`,
        depthTest: false,
        renderOrder,
      })
      : null;
    if (model && group && typeof group.add === "function") group.add(model);
    const anchor = typeof resolveSpawnAnchor === "function"
      ? (resolveSpawnAnchor(spawn, index) || {})
      : {};
    const pickup = {
      id: globeId,
      globeId,
      emitterId,
      model,
      anchorXW: Number(anchor.x) || 0,
      anchorYW: Number(anchor.y) || 0,
      driftAmp: baseOrb * Math.max(0, readNumber(idle, ["driftRangeBO", "driftRatio"], 0.1)),
      bobAmp: baseOrb * Math.max(0, readNumber(idle, ["bobRangeBO", "bobRatio"], 0.07)),
      bobHz: Math.max(0, clampNumber(idle.bobHz, 0.65)),
      pulseScale: Math.max(0, clampNumber(idle.pulseScale, 0.045)),
      pulseHz: Math.max(0, clampNumber(idle.pulseHz, 0.9)),
      phase: Math.random() * Math.PI * 2,
      active: true,
      fadeInStartMs: 0,
      spawn,
    };
    state.map.set(globeId, pickup);
    return pickup;
  }

  function loadSpawns(spawns = []) {
    clear();
    const spawnList = Array.isArray(spawns) ? spawns : [];
    publishSpawnCount(spawnList.length);
    state.pickups = spawnList.map(makePickup);
    publishActiveCount();
    requestFrame();
  }

  function collect(payload = {}) {
    const globeId = String(payload.globeId || payload.id || "");
    const pickup = state.map.get(globeId);
    if (pickup) pickup.active = false;
    publishActiveCount();
    requestFrame();
  }

  function markSpent(payload = {}) {
    const emitterId = String(payload.emitterId || "");
    const pickup = state.pickups.find((entry) => String(entry && entry.emitterId || "") === emitterId);
    if (!pickup) return;
    pickup.active = true;
    pickup.fadeInStartMs = now();
    publishActiveCount();
    requestFrame();
  }

  function resetToIdle() {
    for (const pickup of state.pickups) {
      if (!pickup) continue;
      pickup.active = true;
      pickup.fadeInStartMs = 0;
    }
    publishActiveCount();
    requestFrame();
  }

  function update(timeSec = 0) {
    const nowMs = now();
    for (const pickup of state.pickups) {
      if (!pickup || !pickup.model) continue;
      pickup.model.visible = !!pickup.active;
      if (!pickup.active) continue;
      const phase = timeSec * Math.PI * 2;
      const drift = Math.sin((phase * 0.23) + pickup.phase) * pickup.driftAmp;
      const bob = Math.sin((phase * pickup.bobHz) + pickup.phase) * pickup.bobAmp;
      const pulse = 1 + (Math.sin((phase * Math.max(0, pickup.pulseHz)) + pickup.phase) * pickup.pulseScale);
      const position = typeof toRuntimePosition === "function"
        ? (toRuntimePosition({ x: pickup.anchorXW, y: pickup.anchorYW, spawn: pickup.spawn }) || {})
        : {};
      pickup.model.position.set(
        (Number(position.x) || 0) + drift,
        (Number(position.y) || 0) + bob,
        Number(position.z) || 0
      );
      pickup.model.scale.setScalar(Math.max(0.01, pulse || 1));
      if (pickup.fadeInStartMs) {
        const age = Math.max(0, (nowMs - pickup.fadeInStartMs) / 900);
        const alpha = Math.max(0, Math.min(1, age));
        pickup.model.scale.multiplyScalar(0.65 + (alpha * 0.35));
        if (alpha >= 1) pickup.fadeInStartMs = 0;
      }
    }
  }

  function clear() {
    for (const pickup of state.pickups) removePickup(pickup);
    state.pickups = [];
    state.map.clear();
    publishActiveCount();
  }

  function pickupNeedsAnimation(pickup) {
    if (!pickup || !pickup.active) return false;
    return (
      Math.abs(Number(pickup.driftAmp) || 0) > 0.001
      || Math.abs(Number(pickup.bobAmp) || 0) > 0.001
      || Math.abs(Number(pickup.pulseScale) || 0) > 0.001
      || !!pickup.fadeInStartMs
    );
  }

  return Object.freeze({
    loadSpawns,
    collect,
    markSpent,
    resetToIdle,
    update,
    hasActiveVisuals() {
      return state.pickups.some((pickup) => pickup && pickup.active);
    },
    hasAnimatingVisuals() {
      return state.pickups.some(pickupNeedsAnimation);
    },
    clear,
    dispose() {
      clear();
      publishSpawnCount(0);
    },
  });
}
