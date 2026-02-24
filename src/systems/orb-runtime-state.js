/**
 * @typedef {Object} OrbRuntimeStateValue
 * @property {number} yW
 * @property {number} v
 * @property {number|null} lastTs
 * @property {number} gravityMul
 * @property {number} lift01
 * @property {number} energy01
 * @property {number} dynamics01
 * @property {boolean} onGround
 * @property {number} descendMs
 * @property {boolean} shieldDescentBlocked
 * @property {boolean} floatGraceActive
 * @property {number} floatGraceUntilMs
 * @property {number} floatGraceAnchorY
 * @property {number} floatGracePhase
 */

/**
 * @param {{initialState?: Partial<OrbRuntimeStateValue>}} [options]
 */
export function createOrbRuntimeState({ initialState = {} } = {}) {
  /** @type {OrbRuntimeStateValue} */
  const state = {
    yW: 0,
    v: 0,
    lastTs: null,
    gravityMul: 0.33,
    lift01: 0,
    energy01: 0,
    dynamics01: 0,
    onGround: false,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceActive: false,
    floatGraceUntilMs: 0,
    floatGraceAnchorY: 0,
    floatGracePhase: 0,
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
    state.v = 0;
    state.lastTs = null;
    state.gravityMul = 0.33;
    state.lift01 = 0;
    state.energy01 = 0;
    state.dynamics01 = 0;
    state.onGround = false;
    state.descendMs = 0;
    state.shieldDescentBlocked = false;
    state.floatGraceActive = false;
    state.floatGraceUntilMs = 0;
    state.floatGraceAnchorY = 0;
    state.floatGracePhase = 0;
    if (next && typeof next === "object") Object.assign(state, next);
    return state;
  }

  return {
    get,
    patch,
    reset,
  };
}
