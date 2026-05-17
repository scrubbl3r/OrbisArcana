import { disposeThreeObject } from "../rendering/three/three-object-utils.js";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "./orb-lifecycle-3d-default.js?v=20260516f";
import {
  createOrbLifecycle3dCracks,
  createOrbLifecycle3dDissolveBurst,
  updateOrbLifecycle3dCracks,
  updateOrbLifecycle3dDissolveBurst,
} from "./orb-lifecycle-3d-vfx-runtime.js?v=20260516n";

const CRACK_UPDATE_FPS = 30;
const CRACK_UPDATE_INTERVAL_MS = 1000 / CRACK_UPDATE_FPS;

function readSeed(payload = {}, fallback = ORB_LIFECYCLE_3D_DEFAULTS.erosionSeed) {
  return Number(payload.fractureSeed || payload.seed || payload.erosionSeed || fallback) || 1;
}

function readMaxHits(payload = {}, fallback = ORB_LIFECYCLE_3D_DEFAULTS.maxHits) {
  return Math.max(1, Math.min(1000, Number(payload.maxHits) || Number(payload.maxHealth) || Number(payload.max) || Number(fallback) || ORB_LIFECYCLE_3D_DEFAULTS.maxHits || 3));
}

function readHitsTaken(payload = {}, fallback = 0, maxHits = readMaxHits(payload)) {
  if (payload.hitsTaken != null) {
    return Math.max(0, Math.min(maxHits, Number(payload.hitsTaken) || 0));
  }
  const maxHealth = Number(payload.maxHealth ?? payload.max);
  const health = Number(payload.health ?? payload.to ?? payload.healthAfter);
  if (Number.isFinite(maxHealth) && maxHealth > 0 && Number.isFinite(health)) {
    return Math.max(0, Math.min(maxHits, Math.floor(maxHealth - Math.max(0, Math.min(maxHealth, health)))));
  }
  return Math.max(0, Math.min(maxHits, Number(fallback) || 0));
}

export function createOrbLifecycle3dRuntime({
  orbModel = null,
  burstParent = null,
  getOrbModel = () => orbModel,
  getBurstParent = () => burstParent,
  getBo = () => 72,
  getConfig = () => ORB_LIFECYCLE_3D_DEFAULTS,
  getBurstPosition = () => ({ x: 0, y: 0, z: 0 }),
  now = () => performance.now(),
  onNeedsFrame = () => {},
} = {}) {
  const state = {
    hitsTaken: 0,
    maxHits: readMaxHits(),
    fractureSeed: readSeed(currentConfig()),
    cracks: null,
    burst: null,
    lastCrackUpdateMs: 0,
  };

  function currentConfig() {
    const config = typeof getConfig === "function" ? getConfig() : null;
    return config && typeof config === "object" ? config : ORB_LIFECYCLE_3D_DEFAULTS;
  }

  function currentBo() {
    return Math.max(1, Number(typeof getBo === "function" ? getBo() : getBo) || 72);
  }

  function currentOrbModel() {
    return typeof getOrbModel === "function" ? getOrbModel() : null;
  }

  function currentBurstParent() {
    return typeof getBurstParent === "function" ? getBurstParent() : null;
  }

  function requestFrame() {
    if (typeof onNeedsFrame === "function") onNeedsFrame();
  }

  function removeCracks() {
    if (state.cracks && state.cracks.parent) {
      state.cracks.parent.remove(state.cracks);
    }
    if (state.cracks) disposeThreeObject(state.cracks);
    state.cracks = null;
    state.lastCrackUpdateMs = 0;
  }

  function clearBurst() {
    if (state.burst && state.burst.parent) {
      state.burst.parent.remove(state.burst);
    }
    if (state.burst) disposeThreeObject(state.burst);
    state.burst = null;
  }

  function setOrbVisible(visible) {
    const model = currentOrbModel();
    if (model) model.visible = !!visible;
  }

  function rebuildCracks() {
    const model = currentOrbModel();
    removeCracks();
    if (!model || state.hitsTaken <= 0) return;
    state.cracks = createOrbLifecycle3dCracks({
      bo: currentBo(),
      hitsTaken: state.hitsTaken,
      maxHits: state.maxHits,
      seed: state.fractureSeed,
      config: currentConfig(),
    });
    model.add(state.cracks);
    state.lastCrackUpdateMs = 0;
    requestFrame();
  }

  function syncDamageState(payload = {}) {
    state.maxHits = readMaxHits(payload, state.maxHits);
    state.hitsTaken = readHitsTaken(payload, state.hitsTaken, state.maxHits);
    state.fractureSeed = readSeed(payload, state.fractureSeed);
    setOrbVisible(true);
    clearBurst();
    rebuildCracks();
    requestFrame();
  }

  function startDissolve(payload = {}) {
    state.hitsTaken = Math.max(state.hitsTaken, Number(payload.hitsTaken) || state.maxHits);
    state.maxHits = readMaxHits(payload, state.maxHits);
    state.fractureSeed = readSeed(payload, state.fractureSeed);
    clearBurst();
    removeCracks();
    setOrbVisible(false);

    state.burst = createOrbLifecycle3dDissolveBurst({
      bo: currentBo(),
      seed: state.fractureSeed,
      config: currentConfig(),
      nowMs: Number(payload.atMs) || now(),
    });
    const position = typeof getBurstPosition === "function" ? (getBurstPosition() || {}) : {};
    state.burst.position.set(
      Number(position.x) || 0,
      Number(position.y) || 0,
      Number(position.z) || 0
    );
    const parent = currentBurstParent();
    if (parent && typeof parent.add === "function") parent.add(state.burst);
    requestFrame();
  }

  function reset(payload = {}) {
    state.hitsTaken = 0;
    state.maxHits = readMaxHits(payload, state.maxHits);
    state.fractureSeed = readSeed(payload, state.fractureSeed);
    clearBurst();
    removeCracks();
    setOrbVisible(true);
  }

  function update(nowMs = now()) {
    if (
      state.cracks &&
      (
        !state.lastCrackUpdateMs ||
        Math.max(0, Number(nowMs) || 0) - state.lastCrackUpdateMs >= CRACK_UPDATE_INTERVAL_MS
      )
    ) {
      state.lastCrackUpdateMs = Math.max(0, Number(nowMs) || 0);
      updateOrbLifecycle3dCracks(state.cracks, nowMs);
    }
    if (state.burst && !updateOrbLifecycle3dDissolveBurst(state.burst, nowMs)) {
      clearBurst();
      return false;
    }
    return !!state.cracks || !!state.burst;
  }

  function attachOrbModel() {
    if (state.burst) {
      setOrbVisible(false);
      return;
    }
    setOrbVisible(true);
    rebuildCracks();
  }

  function dispose() {
    clearBurst();
    removeCracks();
  }

  return Object.freeze({
    syncDamageState,
    applyDamage: syncDamageState,
    heal: syncDamageState,
    startDissolve,
    reset,
    update,
    attachOrbModel,
    detachOrbModel() {
      removeCracks();
    },
    hasActiveVisuals() {
      return !!state.cracks || !!state.burst;
    },
    dispose,
  });
}
