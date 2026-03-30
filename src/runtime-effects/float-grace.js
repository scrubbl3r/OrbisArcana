/**
 * Canonical float grace runtime effect implementation.
 */
export function executeFloatGrace({
  grantSuperGrace,
  ms,
} = {}) {
  if (typeof grantSuperGrace !== "function") {
    return { handled: false };
  }
  grantSuperGrace(Number.isFinite(Number(ms)) ? Number(ms) : undefined);
  return { handled: true };
}

export function clearFloatGraceRuntime({
  patchOrbRuntime,
} = {}) {
  if (typeof patchOrbRuntime !== "function") return;
  patchOrbRuntime({
    floatGraceActive: false,
    floatGraceUntilMs: 0,
  });
}

export function grantFloatGraceRuntime({
  patchOrbRuntime,
  getOrbRuntime,
  durationMs,
  defaultMs = 1000,
  nowMs = performance.now(),
  random = Math.random,
} = {}) {
  if (typeof patchOrbRuntime !== "function" || typeof getOrbRuntime !== "function") return;
  const dur = Math.max(50, Number(durationMs) || Number(defaultMs) || 1000);
  const orbRuntime = getOrbRuntime();
  patchOrbRuntime({
    floatGraceActive: true,
    floatGraceUntilMs: Number(nowMs) + dur,
    floatGraceAnchorY: Number(orbRuntime && orbRuntime.yW) || 0,
    floatGracePhase: (typeof random === "function" ? random() : Math.random()) * Math.PI * 2,
  });
}

export function grantSuperGraceRuntime({
  resetInputProcessingState,
  grantFloatGrace,
  durationMs,
  defaultMs = 2500,
  nowMs = performance.now(),
} = {}) {
  if (typeof resetInputProcessingState === "function") {
    resetInputProcessingState(Number(nowMs));
  }
  if (typeof grantFloatGrace !== "function") return;
  grantFloatGrace(Number.isFinite(Number(durationMs)) ? Number(durationMs) : Number(defaultMs) || 2500);
}

export function isFloatGraceActiveRuntime({
  getOrbRuntime,
  clearFloatGrace,
  nowMs,
} = {}) {
  if (typeof getOrbRuntime !== "function") return false;
  const orbRt = getOrbRuntime();
  if (!orbRt || !orbRt.floatGraceActive) return false;
  if ((Number(nowMs) || 0) <= Number(orbRt.floatGraceUntilMs || 0)) return true;
  if (typeof clearFloatGrace === "function") clearFloatGrace();
  return false;
}
