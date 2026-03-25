import {
  EVT_INPUT_SHAKE_TRIGGERED,
  EVT_SPELL_WINDOW_SPIN_OPENED,
  EVT_SPELL_WINDOW_SPIN_CLOSED,
  EVT_VOICE_SET_MODE,
} from "../contracts/events.js";

/**
 * @typedef {Object} InputGestureSystem
 * @property {() => void} start
 * @property {() => void} stop
 * @property {(atMs?: number) => void} reset Clears shake + spin-window runtime state and invokes reset hooks.
 * @property {(sample?: {shakeVal01?:number, groove01?:number, atMs?:number}) => boolean} processShakeSample Returns `true` if a shake hit was registered.
 * @property {(frame?: {raw?:Object, atMs?:number, stabilityOn?:boolean, stabilityVisualGate?:boolean}) => void} processSpinFrame
 * @property {(code:string, atMs?:number) => void} setPendingDirection
 * @property {() => number} getShakeCooldownUntil
 */

/**
 * @typedef {Object} CreateInputGestureSystemOptions
 * @property {Object} eventBus Event bus with `emit` (and typically `on` for symmetry).
 * @property {() => number} [nowMs] Clock function.
 * @property {Object} [config] Gesture tuning values (shake + spin-window thresholds/timings).
 * @property {Object} [hooks] Receiver-provided side-effect hooks (lamps, shockwave, orb color, etc).
 */

/**
 * Gesture runtime system for:
 * - shake detection / cooldown / direction cache
 * - spin-window detection and gate events
 *
 * Emits events defined in `src/contracts/events.js`.
 *
 * @param {CreateInputGestureSystemOptions} [options]
 * @returns {InputGestureSystem}
 */
export function createInputGestureSystem({
  eventBus,
  nowMs = () => Date.now(),
  config = {},
  hooks = {},
} = {}) {
  const cfg = {
    shakeCooldownMs: Math.max(0, Number(config.shakeCooldownMs) || 2500),
    shakeMode: Math.max(1, Math.min(3, Math.round(Number(config.shakeMode) || 2))),
    grooveShakeGate: Number.isFinite(Number(config.grooveShakeGate)) ? Number(config.grooveShakeGate) : 0.20,
    shakeLampThr: Number.isFinite(Number(config.shakeLampThr)) ? Number(config.shakeLampThr) : 1.65,
    sdRecentMs: Math.max(0, Number(config.sdRecentMs) || 750),
    flatSpinDominanceOn: Number.isFinite(Number(config.flatSpinDominanceOn)) ? Number(config.flatSpinDominanceOn) : 0.72,
    flatSpinDominanceOff: Number.isFinite(Number(config.flatSpinDominanceOff)) ? Number(config.flatSpinDominanceOff) : 0.60,
    flatSpinDominanceGapOn: Number.isFinite(Number(config.flatSpinDominanceGapOn)) ? Number(config.flatSpinDominanceGapOn) : 0.14,
    flatSpinDominanceGapOff: Number.isFinite(Number(config.flatSpinDominanceGapOff)) ? Number(config.flatSpinDominanceGapOff) : 0.09,
    flatSpinOnHoldMs: Math.max(0, Number(config.flatSpinOnHoldMs) || 200),
    flatSpinOffHoldMs: Math.max(0, Number(config.flatSpinOffHoldMs) || 280),
    flatSpinGateRefreshMs: Math.max(0, Number(config.flatSpinGateRefreshMs) || 1100),
    flatSpinMinSpeed01: Number.isFinite(Number(config.flatSpinMinSpeed01)) ? Number(config.flatSpinMinSpeed01) : 0.02,
  };

  const state = {
    shakeCooldownUntil: 0,
    pendingSd: null,
    pendingSdAt: 0,
    flatSpin: {
      active: false,
      axis: "",
      holdMs: 0,
      releaseMs: 0,
      lastTs: 0,
      lastGateRefreshMs: 0,
    },
  };

  function clamp(v, lo, hi) {
    const n = Number(v);
    const x = Number.isFinite(n) ? n : lo;
    return Math.max(lo, Math.min(hi, x));
  }

  function clamp01(v) {
    return clamp(v, 0, 1);
  }

  function shakeGroupFromCode(code) {
    const c = String(code || "").trim().toUpperCase();
    if (c === "U" || c === "D") return "UD";
    if (c === "L" || c === "R") return "LR";
    if (c === "F" || c === "B") return "FB";
    return "";
  }

  function resetShakeCachesAfterHit() {
    state.pendingSd = null;
    state.pendingSdAt = 0;
  }

  function getShakeCooldownUntil() {
    return Number(state.shakeCooldownUntil) || 0;
  }

  function setPendingDirection(code, atMs = nowMs()) {
    const c = String(code || "").trim();
    if (!c) return;
    state.pendingSd = c;
    state.pendingSdAt = Number(atMs) || nowMs();
  }

  function reset(atMs = nowMs()) {
    state.shakeCooldownUntil = 0;
    state.pendingSd = null;
    state.pendingSdAt = 0;
    closeFlatSpinWindow("reset", Number(atMs) || nowMs());
    state.flatSpin.lastTs = 0;
    state.flatSpin.holdMs = 0;
    state.flatSpin.releaseMs = 0;

    if (typeof hooks.forceShakeLampOff === "function") hooks.forceShakeLampOff();
    if (typeof hooks.clearDirLampTimers === "function") hooks.clearDirLampTimers();
    if (typeof hooks.allDirLampOff === "function") hooks.allDirLampOff();
    if (typeof hooks.onReset === "function") hooks.onReset(Number(atMs) || nowMs());
  }

  function processShakeSample({ shakeVal01, groove01, atMs = nowMs() } = {}) {
    const now = Number(atMs) || nowMs();
    const v = Number(shakeVal01);
    if (!Number.isFinite(v)) return false;
    if (Number(groove01) > cfg.grooveShakeGate) return false;

    if (now < state.shakeCooldownUntil && typeof hooks.forceShakeLampOff === "function") {
      hooks.forceShakeLampOff();
    }
    if (now < state.shakeCooldownUntil) return false;
    if (v < cfg.shakeLampThr) return false;
    return registerShakeHit(now);
  }

  function registerShakeHit(now) {
    if (now < state.shakeCooldownUntil) return false;
    if (typeof hooks.isDiversityLampLit === "function" && hooks.isDiversityLampLit()) return false;
    if (typeof hooks.canSpendShake === "function" && !hooks.canSpendShake()) return false;

    if (typeof hooks.spendShake === "function") hooks.spendShake();
    if (typeof hooks.flashShakeLamp === "function") hooks.flashShakeLamp(400);

    let shakeCode = "";
    if (state.pendingSd && (now - state.pendingSdAt) <= cfg.sdRecentMs) {
      const code = String(state.pendingSd || "").trim().toUpperCase();
      shakeCode = code;
      if (cfg.shakeMode === 1) {
        if (typeof hooks.clearDirLampTimers === "function") hooks.clearDirLampTimers();
        if (typeof hooks.allDirLampOff === "function") hooks.allDirLampOff();
      } else if (cfg.shakeMode === 2) {
        if ((code === "U" || code === "D") && typeof hooks.flashDirLampPair === "function") hooks.flashDirLampPair("U", "D", 420);
        else if ((code === "L" || code === "R") && typeof hooks.flashDirLampPair === "function") hooks.flashDirLampPair("L", "R", 420);
        else if ((code === "F" || code === "B") && typeof hooks.flashDirLampPair === "function") hooks.flashDirLampPair("F", "B", 420);
      } else if (typeof hooks.flashDirLampSingle === "function") {
        hooks.flashDirLampSingle(code, 420);
      }
    }

    if (eventBus && typeof eventBus.emit === "function") {
      /** @type {import("../contracts/events.js").InputShakeTriggeredPayload} */
      const payload = {
        code: shakeCode,
        group: shakeGroupFromCode(shakeCode),
        atMs: now,
      };
      eventBus.emit(EVT_INPUT_SHAKE_TRIGGERED, payload);
    }

    resetShakeCachesAfterHit();
    state.shakeCooldownUntil = now + cfg.shakeCooldownMs;
    return true;
  }

  function axisFromShieldAxis(shieldAxis) {
    if (!Array.isArray(shieldAxis) || shieldAxis.length < 3) return null;
    const gx = Math.max(0, Number(shieldAxis[2]) || 0);
    const gy = Math.max(0, Number(shieldAxis[1]) || 0);
    const gz = Math.max(0, Number(shieldAxis[0]) || 0);
    const sum = gx + gy + gz;
    if (!(sum > 1e-6)) return null;
    const vals = [
      { axis: "x", v: gx / sum },
      { axis: "y", v: gy / sum },
      { axis: "z", v: gz / sum },
    ];
    vals.sort((a, b) => b.v - a.v);
    return { axis: vals[0].axis, v: vals[0].v, gap: vals[0].v - vals[1].v, source: "axis" };
  }

  function axisFromShieldRgb(shieldRGB) {
    if (!Array.isArray(shieldRGB) || shieldRGB.length < 3) return null;
    const r = Math.max(0, Number(shieldRGB[0]) || 0);
    const g = Math.max(0, Number(shieldRGB[1]) || 0);
    const b = Math.max(0, Number(shieldRGB[2]) || 0);
    const sum = r + g + b;
    if (!(sum > 1e-6)) return null;
    const vals = [
      { axis: "x", v: b / sum },
      { axis: "y", v: g / sum },
      { axis: "z", v: r / sum },
    ];
    vals.sort((a, b) => b.v - a.v);
    return { axis: vals[0].axis, v: vals[0].v, gap: vals[0].v - vals[1].v, source: "rgb" };
  }

  function axisFromVisibleShield(raw) {
    return axisFromShieldAxis(raw && raw.shieldAxis) || axisFromShieldRgb(raw && raw.shieldRGB);
  }

  function openFlatSpinWindow(axis, atMs) {
    const fs = state.flatSpin;
    fs.active = true;
    fs.axis = axis;
    fs.releaseMs = 0;
    fs.lastGateRefreshMs = atMs;
    if (typeof hooks.setOrbStrokeColorByAxis === "function") hooks.setOrbStrokeColorByAxis(axis);
    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit(EVT_SPELL_WINDOW_SPIN_OPENED, { axis, atMs });
      eventBus.emit(EVT_VOICE_SET_MODE, { mode: "gated_window" });
    }
  }

  function closeFlatSpinWindow(reason, atMs) {
    const fs = state.flatSpin;
    if (!fs.active) return;
    const axis = fs.axis;
    fs.active = false;
    fs.axis = "";
    fs.holdMs = 0;
    fs.releaseMs = 0;
    fs.lastGateRefreshMs = 0;
    if (typeof hooks.resetOrbStrokeColor === "function") hooks.resetOrbStrokeColor();
    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit(EVT_SPELL_WINDOW_SPIN_CLOSED, { axis, reason, atMs });
      eventBus.emit(EVT_VOICE_SET_MODE, { mode: "wake_token_open_world" });
    }
  }

  function processFlatSpinFrame({
    raw = null,
    atMs = nowMs(),
    stabilityOn = false,
    stabilityVisualGate = false,
  } = {}) {
    const now = Number(atMs) || nowMs();
    const fs = state.flatSpin;
    const dt = fs.lastTs ? clamp(now - fs.lastTs, 0, 120) : 0;
    fs.lastTs = now;

    const axisInfo = axisFromVisibleShield(raw);
    void stabilityOn;
    // Preserve the older "always responsive" spin feel by qualifying from the visual
    // spin gate + axis signal, without requiring dynamics stability to be armed.
    const stableEnough = !!stabilityVisualGate;
    const canQualify = !!axisInfo && stableEnough;
    const isAxisSignal = !!(axisInfo && axisInfo.source === "axis");
    const domOnReq = isAxisSignal ? 0.56 : cfg.flatSpinDominanceOn;
    const domOffReq = isAxisSignal ? 0.48 : cfg.flatSpinDominanceOff;
    const gapOnReq = isAxisSignal ? 0.06 : cfg.flatSpinDominanceGapOn;
    const gapOffReq = isAxisSignal ? 0.03 : cfg.flatSpinDominanceGapOff;

    if (fs.active) {
      const sameAxis = canQualify
        && axisInfo.axis === fs.axis
        && axisInfo.v >= domOffReq
        && (Number(axisInfo.gap) >= gapOffReq);
      if (sameAxis) {
        if (typeof hooks.setOrbStrokeColorByAxis === "function") hooks.setOrbStrokeColorByAxis(axisInfo.axis);
        fs.releaseMs = 0;
        if ((now - fs.lastGateRefreshMs) >= cfg.flatSpinGateRefreshMs) {
          fs.lastGateRefreshMs = now;
        }
        return;
      }
      fs.releaseMs += dt;
      if (fs.releaseMs >= cfg.flatSpinOffHoldMs) {
        closeFlatSpinWindow("unstable", now);
      }
      return;
    }

    const qualify = canQualify && axisInfo.v >= domOnReq && (Number(axisInfo.gap) >= gapOnReq);
    if (!qualify) {
      fs.holdMs = 0;
      return;
    }

    if (fs.axis && fs.axis !== axisInfo.axis) {
      fs.holdMs = 0;
    }
    fs.axis = axisInfo.axis;
    fs.holdMs += dt;
    if (fs.holdMs >= cfg.flatSpinOnHoldMs) {
      openFlatSpinWindow(fs.axis, now);
    }
  }

  function start() {}
  function stop() {}

  return {
    start,
    stop,
    reset,
    processShakeSample,
    processFlatSpinFrame,
    setPendingDirection,
    getShakeCooldownUntil,
  };
}
