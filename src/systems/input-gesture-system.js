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
  };

  const state = {
    shakeCooldownUntil: 0,
    pendingSd: null,
    pendingSdAt: 0,
  };

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
    if (typeof hooks.triggerShockwave === "function") hooks.triggerShockwave();

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
      eventBus.emit("input.shake_triggered", {
        code: shakeCode,
        group: shakeGroupFromCode(shakeCode),
        atMs: now,
      });
    }

    resetShakeCachesAfterHit();
    state.shakeCooldownUntil = now + cfg.shakeCooldownMs;
    return true;
  }

  function start() {}
  function stop() {}

  return {
    start,
    stop,
    reset,
    processShakeSample,
    setPendingDirection,
    getShakeCooldownUntil,
  };
}
