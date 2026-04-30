import * as THREE from "three";
import { disposeThreeObject } from "../rendering/three/three-object-utils.js";
import { ORB_GLOBE_3D_VISUAL_DEFAULTS } from "./orb-globe-3d-default.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function randRange(min, max, fallback = 0) {
  const lo = clampNumber(min, fallback);
  const hi = clampNumber(max, lo);
  if (hi <= lo) return lo;
  return lo + (Math.random() * (hi - lo));
}

function normalizeGlobePayload(payload = {}) {
  return Object.freeze({
    globeId: String(payload.globeId || payload.boundGlobeId || payload.id || ""),
    slot: String(payload.slot || "").toUpperCase(),
    emitterId: String(payload.emitterId || ""),
    axis: String(payload.axis || "").toLowerCase(),
    state: String(payload.state || "loaded"),
  });
}

export function createOrbGlobe3dRuntime({
  group = null,
  createGlobeObject = null,
  getBo = () => 72,
  getCenterPosition = () => ({ x: 0, y: 0, z: 0 }),
  getConfig = () => ORB_GLOBE_3D_VISUAL_DEFAULTS,
  onCountChange = () => {},
  onNeedsFrame = () => {},
} = {}) {
  const state = {
    orbiting: [],
    inner: [],
    dead: false,
  };

  function currentBo() {
    return Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
  }

  function currentConfig() {
    const config = typeof getConfig === "function" ? getConfig() : null;
    return config && typeof config === "object" ? config : ORB_GLOBE_3D_VISUAL_DEFAULTS;
  }

  function count() {
    return state.orbiting.length + state.inner.length;
  }

  function publishCount() {
    if (typeof onCountChange === "function") onCountChange(count());
  }

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function removeParticle(list, predicate) {
    const index = list.findIndex(predicate);
    if (index < 0) return null;
    const [entry] = list.splice(index, 1);
    if (entry && entry.model) {
      if (group && typeof group.remove === "function") group.remove(entry.model);
      disposeThreeObject(entry.model);
    }
    publishCount();
    return entry || null;
  }

  function findParticle(list, payload = {}) {
    const globe = normalizeGlobePayload(payload);
    return list.find((entry) => (
      (globe.globeId && String(entry.globeId || "") === globe.globeId)
      || (globe.slot && String(entry.slot || "").toUpperCase() === globe.slot)
    )) || null;
  }

  function makeParticle(payload = {}, mode = "orbiting") {
    const globe = normalizeGlobePayload(payload);
    const config = currentConfig();
    const bo = currentBo() * Math.max(0.01, clampNumber(config.loadedDiameterRatio, 0.17));
    const model = typeof createGlobeObject === "function"
      ? createGlobeObject({
        bo,
        materialConfig: config.material,
        name: `orb_globe3d:${mode}:${globe.globeId || globe.slot || "globe"}`,
      })
      : null;
    if (model && group && typeof group.add === "function") group.add(model);
    const speedMin = mode === "inner" ? config.innerSpeedMinPxPerSec : config.orbitSpeedMin;
    const speedMax = mode === "inner" ? config.innerSpeedMaxPxPerSec : config.orbitSpeedMax;
    return {
      ...globe,
      model,
      mode,
      phase: Math.random() * Math.PI * 2,
      tilt: randRange(-0.85, 0.85, 0),
      drift: randRange(
        mode === "inner" ? config.innerDriftMin : config.orbitDriftMin,
        mode === "inner" ? config.innerDriftMax : config.orbitDriftMax,
        0.2
      ),
      speed: randRange(speedMin, speedMax, speedMin),
      velocity: new THREE.Vector3(randRange(-1, 1), randRange(-1, 1), randRange(-1, 1)).normalize(),
      offset: new THREE.Vector3(randRange(-4, 4), randRange(-4, 4), randRange(-4, 4)),
    };
  }

  function reconcileInventory(globes = []) {
    const active = (Array.isArray(globes) ? globes : [])
      .map(normalizeGlobePayload)
      .filter((globe) => globe.globeId && globe.state !== "spent");
    const activeIds = new Set(active.map((globe) => globe.globeId));
    for (let i = state.orbiting.length - 1; i >= 0; i -= 1) {
      const entry = state.orbiting[i];
      if (!entry.globeId || !activeIds.has(entry.globeId)) {
        removeParticle(state.orbiting, (_, idx) => idx === i);
      }
    }
    for (const globe of active) {
      if (globe.state === "bound") continue;
      if (!findParticle(state.orbiting, globe) && !findParticle(state.inner, globe)) {
        state.orbiting.push(makeParticle(globe, "orbiting"));
      }
    }
    publishCount();
    requestFrame();
  }

  function load(payload = {}) {
    const existingOrbit = removeParticle(state.orbiting, (entry) => entry === findParticle(state.orbiting, payload));
    const source = existingOrbit || payload;
    if (!findParticle(state.inner, payload)) {
      state.inner.push(makeParticle(source, "inner"));
    }
    publishCount();
    requestFrame();
  }

  function consume(payload = {}) {
    removeParticle(state.orbiting, (entry) => entry === findParticle(state.orbiting, payload));
    removeParticle(state.inner, (entry) => entry === findParticle(state.inner, payload));
    publishCount();
  }

  function clear() {
    while (state.orbiting.length) removeParticle(state.orbiting, () => true);
    while (state.inner.length) removeParticle(state.inner, () => true);
    publishCount();
  }

  function setDead(dead = true) {
    state.dead = !!dead;
    if (state.dead) clear();
    requestFrame();
  }

  function updateOrbiting(timeSec = 0) {
    const config = currentConfig();
    const baseOrb = currentBo();
    const radius = Math.max(
      baseOrb * Math.max(0.1, clampNumber(config.orbitDistanceRatio, 1.07)),
      clampNumber(config.orbitDistanceMinPx, 3)
    );
    const center = typeof getCenterPosition === "function" ? (getCenterPosition() || {}) : {};
    const cx = Number(center.x) || 0;
    const cy = Number(center.y) || 0;
    const cz = Number(center.z) || 0;
    for (const entry of state.orbiting) {
      if (!entry || !entry.model) continue;
      const speed = clampNumber(entry.speed, 25) * 0.01;
      const angle = entry.phase + (timeSec * speed * Math.PI * 2);
      const driftAngle = entry.phase + (timeSec * Math.max(0.01, entry.drift) * Math.PI * 2);
      const y = Math.sin(driftAngle) * radius * 0.35;
      const z = Math.cos(angle + entry.tilt) * radius * 0.72;
      const x = Math.sin(angle) * radius;
      entry.model.visible = !state.dead;
      entry.model.position.set(cx + x, cy + y, cz + z);
    }
  }

  function updateInner(dtSec = 0.016) {
    const config = currentConfig();
    const baseOrb = currentBo();
    const shellRadius = baseOrb * 0.5;
    const padding = shellRadius * Math.max(0, clampNumber(config.innerPaddingRatio, 0.22));
    const bound = Math.max(1, shellRadius - padding);
    const center = typeof getCenterPosition === "function" ? (getCenterPosition() || {}) : {};
    const cx = Number(center.x) || 0;
    const cy = Number(center.y) || 0;
    const cz = Number(center.z) || 0;
    for (const entry of state.inner) {
      if (!entry || !entry.model) continue;
      const speed = Math.max(0, clampNumber(entry.speed, 80));
      entry.offset.addScaledVector(entry.velocity, speed * dtSec);
      if (entry.offset.length() > bound) {
        entry.offset.setLength(bound);
        const normal = entry.offset.clone().normalize();
        entry.velocity.reflect(normal).normalize();
      }
      entry.model.visible = !state.dead;
      entry.model.position.set(cx + entry.offset.x, cy + entry.offset.y, cz + entry.offset.z);
    }
  }

  function update({ timeSec = 0, dtSec = 0.016 } = {}) {
    updateOrbiting(timeSec);
    updateInner(dtSec);
  }

  return Object.freeze({
    reconcileInventory,
    load,
    consume,
    clear,
    setDead,
    revive() {
      state.dead = false;
      requestFrame();
    },
    update,
    hasActiveVisuals() {
      return count() > 0;
    },
    count,
    dispose() {
      clear();
    },
  });
}

