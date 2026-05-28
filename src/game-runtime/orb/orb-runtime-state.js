/**
 * @typedef {Object} OrbRuntimeStateValue
 * @property {number} yW
 * @property {number} xW
 * @property {number} v
 * @property {number} vx
 * @property {number|null} lastTs
 * @property {number} gravityMul
 * @property {number} lift01
 * @property {number} energy01
 * @property {number} dynamics01
 * @property {number} motionTrust01
 * @property {number} fallCatch01
 * @property {number} steerIntentX
 * @property {boolean} steerActive
 * @property {boolean} onGround
 * @property {number} descendMs
 * @property {boolean} shieldDescentBlocked
 * @property {boolean} floatGraceActive
 * @property {number} floatGraceUntilMs
 * @property {boolean} floatGracePersistent
 * @property {string} floatGraceSource
 * @property {string} floatGraceClearPolicy
 * @property {string} floatGraceLockSource
 * @property {boolean} floatGraceSuppressInput
 * @property {boolean} floatGraceBreakOnLift
 * @property {boolean} floatGraceBreakOnMotion
 * @property {number} floatGraceStartedAtMs
 * @property {number} floatGraceMinBreakMs
 * @property {number} floatGraceAnchorY
 * @property {number} floatGracePhase
 * @property {boolean} teleportHoldActive
 * @property {number} teleportHoldAnchorY
 * @property {boolean} spawnHoldActive
 * @property {number} spawnHoldAnchorX
 * @property {number} spawnHoldAnchorY
 * @property {number} spawnHoldStartedAtMs
 */

/**
 * @param {{initialState?: Partial<OrbRuntimeStateValue>}} [options]
 */
export function createOrbRuntimeState({ initialState = {} } = {}) {
  /** @type {OrbRuntimeStateValue} */
  const state = {
    yW: 0,
    xW: 0,
    v: 0,
    vx: 0,
    lastTs: null,
    gravityMul: 0.34,
    lift01: 0,
    energy01: 0,
    dynamics01: 0,
    motionTrust01: 0,
    fallCatch01: 0,
    steerIntentX: 0,
    steerActive: false,
    onGround: false,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceActive: false,
    floatGraceUntilMs: 0,
    floatGracePersistent: false,
    floatGraceSource: "",
    floatGraceClearPolicy: "",
    floatGraceLockSource: "",
    floatGraceSuppressInput: false,
    floatGraceBreakOnLift: true,
    floatGraceBreakOnMotion: true,
    floatGraceStartedAtMs: 0,
    floatGraceMinBreakMs: 0,
    floatGraceAnchorY: 0,
    floatGracePhase: 0,
    teleportHoldActive: false,
    teleportHoldAnchorY: 0,
    spawnHoldActive: false,
    spawnHoldAnchorX: 0,
    spawnHoldAnchorY: 0,
    spawnHoldStartedAtMs: 0,
    ...(initialState || {}),
  };

  function get() {
    return state;
  }

  function patch(next = {}) {
    Object.assign(state, next || {});
    return state;
  }

  function reset(next = {}) {
    state.yW = 0;
    state.xW = 0;
    state.v = 0;
    state.vx = 0;
    state.lastTs = null;
    state.gravityMul = 0.34;
    state.lift01 = 0;
    state.energy01 = 0;
    state.dynamics01 = 0;
    state.motionTrust01 = 0;
    state.fallCatch01 = 0;
    state.steerIntentX = 0;
    state.steerActive = false;
    state.onGround = false;
    state.descendMs = 0;
    state.shieldDescentBlocked = false;
    state.floatGraceActive = false;
    state.floatGraceUntilMs = 0;
    state.floatGracePersistent = false;
    state.floatGraceSource = "";
    state.floatGraceClearPolicy = "";
    state.floatGraceLockSource = "";
    state.floatGraceSuppressInput = false;
    state.floatGraceBreakOnLift = true;
    state.floatGraceBreakOnMotion = true;
    state.floatGraceStartedAtMs = 0;
    state.floatGraceMinBreakMs = 0;
    state.floatGraceAnchorY = 0;
    state.floatGracePhase = 0;
    state.teleportHoldActive = false;
    state.teleportHoldAnchorY = 0;
    state.spawnHoldActive = false;
    state.spawnHoldAnchorX = 0;
    state.spawnHoldAnchorY = 0;
    state.spawnHoldStartedAtMs = 0;
    if (next && typeof next === "object") Object.assign(state, next);
    return state;
  }

  return {
    get,
    patch,
    reset,
  };
}
