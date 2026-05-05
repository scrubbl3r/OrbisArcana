import * as THREE from "three";
import { disposeThreeObject } from "../rendering/three/three-object-utils.js";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "../world/world-globe-3d-default.js";
import { ORB_GLOBE_3D_VISUAL_DEFAULTS } from "./orb-globe-3d-default.js";

const UP = new THREE.Vector3(0, 1, 0);
const TWO_PI = Math.PI * 2;
const TMP_A = new THREE.Vector3();
const TMP_B = new THREE.Vector3();
const TMP_C = new THREE.Vector3();

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function randRange(min, max, fallback = 0) {
  const a = clampNumber(min, fallback);
  const b = clampNumber(max, a);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (hi <= lo) return lo;
  return lo + (Math.random() * (hi - lo));
}

function readNumber(source, keys = [], fallback = 0) {
  const object = source && typeof source === "object" ? source : {};
  for (const key of keys) {
    const value = Number(object[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function readSpeedBOPerSec(source, bo, newKey, legacyPxKey, fallback = 0) {
  const object = source && typeof source === "object" ? source : {};
  const authored = Number(object[newKey]);
  if (Number.isFinite(authored)) return authored;
  const legacyPx = Number(object[legacyPxKey]);
  if (Number.isFinite(legacyPx)) return legacyPx / Math.max(1, Number(bo) || 1);
  return fallback;
}

function readOrbitHz(source, newKey, legacyKey, fallback = 0) {
  const object = source && typeof source === "object" ? source : {};
  const authored = Number(object[newKey]);
  if (Number.isFinite(authored)) return authored;
  const legacy = Number(object[legacyKey]);
  if (Number.isFinite(legacy)) return legacy * 0.01;
  return fallback;
}

function createPlane() {
  const normal = new THREE.Vector3(
    randRange(-1, 1),
    randRange(-0.65, 0.65),
    randRange(-1, 1)
  ).normalize();
  if (!Number.isFinite(normal.x)) normal.set(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(normal, UP);
  if (u.lengthSq() < 0.001) u.crossVectors(normal, new THREE.Vector3(1, 0, 0));
  u.normalize();
  const v = new THREE.Vector3().crossVectors(normal, u).normalize();
  return { normal, u, v };
}

function applyBounceDrift(velocity, normal, driftMin = 0, driftMax = 0) {
  const speed = velocity.length();
  if (speed <= 0) return;
  const drift = randRange(driftMin, driftMax, 0);
  if (drift <= 0) {
    velocity.setLength(speed);
    return;
  }
  const tangent = TMP_B.set(randRange(-1, 1), randRange(-1, 1), randRange(-1, 1));
  tangent.addScaledVector(normal, -tangent.dot(normal));
  if (tangent.lengthSq() < 0.0001) tangent.crossVectors(normal, UP);
  if (tangent.lengthSq() < 0.0001) tangent.set(1, 0, 0);
  tangent.normalize();
  const signedDrift = drift * (Math.random() < 0.5 ? -1 : 1);
  velocity.addScaledVector(tangent, Math.tan(signedDrift) * speed);
  if (velocity.dot(normal) >= 0) velocity.addScaledVector(normal, -(velocity.dot(normal) + 0.001));
  velocity.normalize().multiplyScalar(speed);
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
  getWorldGlobeConfig = () => WORLD_GLOBE_3D_VISUAL_DEFAULTS,
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

  function currentWorldGlobeConfig() {
    const config = typeof getWorldGlobeConfig === "function" ? getWorldGlobeConfig() : null;
    return config && typeof config === "object" ? config : WORLD_GLOBE_3D_VISUAL_DEFAULTS;
  }

  function globeDiameterBOForMode(mode = "orbiting") {
    const config = currentWorldGlobeConfig();
    const stateConfig = mode === "inner" ? config.consumed : config.collected;
    const fallback = mode === "inner" ? 0.10 : 0.17;
    return Math.max(0.01, readNumber(stateConfig, ["diameterBO", "diameterRatio"], fallback));
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
    const worldConfig = currentWorldGlobeConfig();
    const baseOrb = currentBo();
    const bo = baseOrb * globeDiameterBOForMode(mode);
    const model = typeof createGlobeObject === "function"
      ? createGlobeObject({
        bo,
        materialConfig: worldConfig.material,
        name: `orb_globe3d:${mode}:${globe.globeId || globe.slot || "globe"}`,
      })
      : null;
    if (model && group && typeof group.add === "function") group.add(model);
    const speedMin = mode === "inner"
      ? readSpeedBOPerSec(config, baseOrb, "innerSpeedMinBOPerSec", "innerSpeedMinPxPerSec", 3.67)
      : readOrbitHz(config, "orbitSpeedMinHz", "orbitSpeedMin", 0.25);
    const speedMax = mode === "inner"
      ? readSpeedBOPerSec(config, baseOrb, "innerSpeedMaxBOPerSec", "innerSpeedMaxPxPerSec", 4.53)
      : readOrbitHz(config, "orbitSpeedMaxHz", "orbitSpeedMax", 0.30);
    return {
      ...globe,
      model,
      mode,
      phase: Math.random() * Math.PI * 2,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitDriftAngle: 0,
      tilt: randRange(-0.85, 0.85, 0),
      direction: Math.random() < 0.5 ? -1 : 1,
      driftDirection: Math.random() < 0.5 ? -1 : 1,
      plane: createPlane(),
      drift: randRange(
        mode === "inner" ? config.innerDriftMin : readNumber(config, ["orbitDriftMinHz", "orbitDriftMin"], 0.5),
        mode === "inner" ? config.innerDriftMax : readNumber(config, ["orbitDriftMaxHz", "orbitDriftMax"], 1),
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
    for (let i = state.inner.length - 1; i >= 0; i -= 1) {
      const entry = state.inner[i];
      if (!entry.globeId || !activeIds.has(entry.globeId)) {
        removeParticle(state.inner, (_, idx) => idx === i);
      }
    }
    for (const globe of active) {
      if (globe.state === "bound") continue;
      if (!findParticle(state.orbiting, globe) && !findParticle(state.inner, globe)) {
        state.inner.push(makeParticle(globe, "inner"));
      }
    }
    publishCount();
    requestFrame();
  }

  function load(payload = {}) {
    const existingInner = removeParticle(state.inner, (entry) => entry === findParticle(state.inner, payload));
    const existingOrbit = removeParticle(state.orbiting, (entry) => entry === findParticle(state.orbiting, payload));
    const source = existingInner || existingOrbit || payload;
    if (!findParticle(state.orbiting, payload)) {
      state.orbiting.push(makeParticle(source, "orbiting"));
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

  function updateOrbiting(dtSec = 0.016) {
    const config = currentConfig();
    const baseOrb = currentBo();
    const radius = Math.max(
      baseOrb * Math.max(0.1, readNumber(config, ["orbitDistanceBO", "orbitDistanceRatio"], 1.07)),
      baseOrb * Math.max(0, readNumber(config, ["orbitDistanceMinBO"], 0.02)),
      clampNumber(config.orbitDistanceMinPx, 0)
    );
    const center = typeof getCenterPosition === "function" ? (getCenterPosition() || {}) : {};
    const cx = Number(center.x) || 0;
    const cy = Number(center.y) || 0;
    const cz = Number(center.z) || 0;
    for (const entry of state.orbiting) {
      if (!entry || !entry.model) continue;
      const plane = entry.plane || (entry.plane = createPlane());
      const speed = clampNumber(entry.speed, 0.25);
      if (!Number.isFinite(entry.orbitAngle)) entry.orbitAngle = Number(entry.phase) || 0;
      if (!Number.isFinite(entry.orbitDriftAngle)) entry.orbitDriftAngle = 0;
      entry.orbitAngle += dtSec * speed * TWO_PI * (entry.direction || 1);
      entry.orbitDriftAngle += dtSec * Math.max(0, entry.drift) * (entry.driftDirection || 1);
      TMP_A.copy(plane.u).applyAxisAngle(plane.normal, entry.orbitDriftAngle);
      TMP_B.copy(plane.v).applyAxisAngle(plane.normal, entry.orbitDriftAngle);
      TMP_C.copy(TMP_A).multiplyScalar(Math.cos(entry.orbitAngle) * radius);
      TMP_C.addScaledVector(TMP_B, Math.sin(entry.orbitAngle) * radius);
      entry.model.visible = !state.dead;
      entry.model.position.set(cx + TMP_C.x, cy + TMP_C.y, cz + TMP_C.z);
    }
  }

  function updateInner(dtSec = 0.016) {
    const config = currentConfig();
    const baseOrb = currentBo();
    const shellRadius = baseOrb * 0.5;
    const padding = baseOrb * Math.max(
      0,
      readNumber(config, ["innerPaddingBO"], readNumber(config, ["innerPaddingRatio"], 0.22) * 0.5)
    );
    const bound = Math.max(1, shellRadius - padding);
    const center = typeof getCenterPosition === "function" ? (getCenterPosition() || {}) : {};
    const cx = Number(center.x) || 0;
    const cy = Number(center.y) || 0;
    const cz = Number(center.z) || 0;
    for (const entry of state.inner) {
      if (!entry || !entry.model) continue;
      const speed = Math.max(0, clampNumber(entry.speed, 4.53)) * baseOrb;
      entry.offset.addScaledVector(entry.velocity, speed * dtSec);
      if (entry.offset.length() > bound) {
        entry.offset.setLength(bound);
        const normal = entry.offset.clone().normalize();
        entry.velocity.reflect(normal).normalize();
        applyBounceDrift(entry.velocity, normal, entry.drift, entry.drift);
      }
      entry.model.visible = !state.dead;
      entry.model.position.set(cx + entry.offset.x, cy + entry.offset.y, cz + entry.offset.z);
    }
  }

  function update({ timeSec = 0, dtSec = 0.016 } = {}) {
    updateOrbiting(dtSec);
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
