import {
  EVT_INPUT_SHAKE_TRIGGERED,
  EVT_SPELL_WINDOW_SPIN_OPENED,
  EVT_SPELL_WINDOW_SPIN_CLOSED,
  EVT_VOICE_SET_MODE,
} from "../../contracts/events.js";

/**
 * @typedef {Object} InputGestureSystem
 * @property {() => void} start
 * @property {() => void} stop
 * @property {(atMs?: number) => void} reset Clears shake + spin-window runtime state and invokes reset hooks.
 * @property {(sample?: {shakeVal01?:number, groove01?:number, lift01?:number, atMs?:number}) => boolean} processShakeSample Returns `true` if a shake hit was registered.
 * @property {(frame?: {raw?:Object, atMs?:number, stabilityOn?:boolean, stabilityVisualGate?:boolean}) => void} processSpinFrame
 * @property {(options?: {atMs?:number, durationMs?:number, transitionMs?:number, source?:string}) => boolean} enableFlatSpinAbilityWindow
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
    liftShakeGate: Number.isFinite(Number(config.liftShakeGate)) ? Number(config.liftShakeGate) : 0.12,
    shakeLampThr: Number.isFinite(Number(config.shakeLampThr)) ? Number(config.shakeLampThr) : 0.90,
    sdRecentMs: Math.max(0, Number(config.sdRecentMs) || 750),
    flatSpinDominanceOn: Number.isFinite(Number(config.flatSpinDominanceOn)) ? Number(config.flatSpinDominanceOn) : 0.72,
    flatSpinDominanceOff: Number.isFinite(Number(config.flatSpinDominanceOff)) ? Number(config.flatSpinDominanceOff) : 0.60,
    flatSpinDominanceGapOn: Number.isFinite(Number(config.flatSpinDominanceGapOn)) ? Number(config.flatSpinDominanceGapOn) : 0.14,
    flatSpinDominanceGapOff: Number.isFinite(Number(config.flatSpinDominanceGapOff)) ? Number(config.flatSpinDominanceGapOff) : 0.09,
    flatSpinOnHoldMs: Math.max(0, Number(config.flatSpinOnHoldMs) || 200),
    flatSpinOffHoldMs: Math.max(0, Number(config.flatSpinOffHoldMs) || 280),
    flatSpinGateRefreshMs: Math.max(0, Number(config.flatSpinGateRefreshMs) || 1100),
    flatSpinMinSpeed01: Number.isFinite(Number(config.flatSpinMinSpeed01)) ? Number(config.flatSpinMinSpeed01) : 0.02,
    flatSpinAbilityWindowMs: Math.max(50, Number(config.flatSpinAbilityWindowMs) || 1500),
    flatSpinAbilityTransitionMs: Math.max(0, Number(config.flatSpinAbilityTransitionMs) || 0),
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
    flatSpinAbility: {
      active: false,
      untilMs: 0,
      transitionUntilMs: 0,
      source: "",
      lastRefreshMs: 0,
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
    clearFlatSpinAbility();
    state.flatSpin.lastTs = 0;
    state.flatSpin.holdMs = 0;
    state.flatSpin.releaseMs = 0;

    if (typeof hooks.forceShakeLampOff === "function") hooks.forceShakeLampOff();
    if (typeof hooks.clearDirLampTimers === "function") hooks.clearDirLampTimers();
    if (typeof hooks.allDirLampOff === "function") hooks.allDirLampOff();
    if (typeof hooks.onReset === "function") hooks.onReset(Number(atMs) || nowMs());
  }

  function processShakeSample({ shakeVal01, groove01, lift01, atMs = nowMs() } = {}) {
    const now = Number(atMs) || nowMs();
    const v = Number(shakeVal01);
    if (!Number.isFinite(v)) return false;
    if (Number(groove01) > cfg.grooveShakeGate) return false;
    if (Number(lift01) > cfg.liftShakeGate) return false;

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

  function axisFromCanonicalSpin(raw) {
    const label = raw && typeof raw.spinAxisLabel === "string" ? String(raw.spinAxisLabel).trim().toLowerCase() : "";
    const dominance = Number(raw && raw.spinAxisDominance);
    const gap = Number(raw && raw.spinAxisGap);
    const vectorSource =
      Array.isArray(raw && raw.spinVector) && raw.spinVector.length >= 3 ? raw.spinVector : null;
    const vector = vectorSource
      ? [
          Math.max(0, Number(vectorSource[0]) || 0),
          Math.max(0, Number(vectorSource[1]) || 0),
          Math.max(0, Number(vectorSource[2]) || 0),
        ]
      : null;

    if (!label || !Number.isFinite(dominance) || !Number.isFinite(gap)) return null;
    if (label !== "x" && label !== "y" && label !== "z") return null;
    // During cutover, only treat canonical spin as authoritative when it is
    // already decisive enough to stand on its own. Otherwise allow legacy
    // shield-derived fallback to preserve current live parity.
    if (dominance < 0.48 || gap < 0.03) return null;

    return {
      axis: label,
      // Preserve the old spin-window feel by treating a canonical axis choice
      // as a quantized gate once it is decisive enough, rather than making the
      // live gate ride every small dominance wobble frame-to-frame.
      v: 1,
      gap: 1,
      source: "axis",
      vector,
      direction: raw && typeof raw.spinDirection === "string" ? String(raw.spinDirection) : null,
      dominance,
      rawGap: gap,
    };
  }

  function openFlatSpinWindow(axis, atMs) {
    const fs = state.flatSpin;
    fs.active = true;
    fs.axis = axis;
    fs.releaseMs = 0;
    fs.lastGateRefreshMs = atMs;
    if (eventBus && typeof eventBus.emit === "function") {
      eventBus.emit(EVT_SPELL_WINDOW_SPIN_OPENED, { axis, atMs });
      eventBus.emit(EVT_VOICE_SET_MODE, { mode: "gated_window" });
    }
  }

  function clearFlatSpinAbility() {
    state.flatSpinAbility.active = false;
    state.flatSpinAbility.untilMs = 0;
    state.flatSpinAbility.transitionUntilMs = 0;
    state.flatSpinAbility.source = "";
    state.flatSpinAbility.lastRefreshMs = 0;
  }

  function enableFlatSpinAbilityWindow({
    atMs = nowMs(),
    durationMs,
    transitionMs,
    source = "",
  } = {}) {
    const now = Number(atMs) || nowMs();
    const transition = Math.max(0, Number(transitionMs) || cfg.flatSpinAbilityTransitionMs);
    const dur = Math.max(transition + 50, Number(durationMs) || cfg.flatSpinAbilityWindowMs);
    state.flatSpinAbility.active = true;
    state.flatSpinAbility.untilMs = now + dur;
    state.flatSpinAbility.transitionUntilMs = now + transition;
    state.flatSpinAbility.source = String(source || "flat_spin_ability");
    state.flatSpinAbility.lastRefreshMs = now;
    state.flatSpin.holdMs = 0;
    state.flatSpin.releaseMs = 0;
    return true;
  }

  function refreshFlatSpinAbility(now) {
    if (!state.flatSpinAbility.active) return false;
    state.flatSpinAbility.untilMs = now + cfg.flatSpinAbilityWindowMs;
    state.flatSpinAbility.lastRefreshMs = now;
    return true;
  }

  function getFlatSpinAbilityState(atMs = nowMs()) {
    const now = Number(atMs) || nowMs();
    return {
      active: !!state.flatSpinAbility.active && now <= Number(state.flatSpinAbility.untilMs || 0),
      transitionActive: !!state.flatSpinAbility.active && now < Number(state.flatSpinAbility.transitionUntilMs || 0),
      untilMs: Number(state.flatSpinAbility.untilMs) || 0,
      transitionUntilMs: Number(state.flatSpinAbility.transitionUntilMs) || 0,
      source: String(state.flatSpinAbility.source || ""),
      lastRefreshMs: Number(state.flatSpinAbility.lastRefreshMs) || 0,
    };
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
    const ability = getFlatSpinAbilityState(now);
    if (!ability.active) {
      if (state.flatSpinAbility.active) clearFlatSpinAbility();
      fs.holdMs = 0;
      fs.releaseMs = 0;
      if (fs.active) closeFlatSpinWindow("ability_expired", now);
      return;
    }
    const axisInfo = axisFromCanonicalSpin(raw);
    void stabilityOn;
    // Preserve the older "always responsive" spin feel by qualifying from the visual
    // spin gate + axis signal, without requiring dynamics stability to be armed.
    const stableEnough = !!stabilityVisualGate;
    const canQualify = !!axisInfo && stableEnough;
    const isCanonicalSignal = !!(axisInfo && axisInfo.source === "canonical");
    const domOnReq = isCanonicalSignal ? 0.56 : cfg.flatSpinDominanceOn;
    const domOffReq = isCanonicalSignal ? 0.48 : cfg.flatSpinDominanceOff;
    const gapOnReq = isCanonicalSignal ? 0.06 : cfg.flatSpinDominanceGapOn;
    const gapOffReq = isCanonicalSignal ? 0.03 : cfg.flatSpinDominanceGapOff;

    if (fs.active) {
      const sameAxis = canQualify
        && axisInfo.axis === fs.axis
        && axisInfo.v >= domOffReq
        && (Number(axisInfo.gap) >= gapOffReq);
      if (sameAxis) {
        fs.releaseMs = 0;
        refreshFlatSpinAbility(now);
        if ((now - fs.lastGateRefreshMs) >= cfg.flatSpinGateRefreshMs) {
          fs.lastGateRefreshMs = now;
          if (eventBus && typeof eventBus.emit === "function") {
            eventBus.emit(EVT_SPELL_WINDOW_SPIN_OPENED, { axis: fs.axis, atMs: now, refresh: true });
          }
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
      refreshFlatSpinAbility(now);
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
    enableFlatSpinAbilityWindow,
    getFlatSpinAbilityState,
    setPendingDirection,
    getShakeCooldownUntil,
  };
}
