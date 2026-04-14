export function clearOrbGraceRuntime({
  patchOrbRuntime,
} = {}) {
  if (typeof patchOrbRuntime !== "function") return;
  patchOrbRuntime({
    floatGraceActive: false,
    floatGraceUntilMs: 0,
  });
}

export function grantOrbGraceRuntime({
  patchOrbRuntime,
  getOrbRuntime,
  grace = null,
  durationMs,
  defaultTtlMs = 2500,
  nowMs = performance.now(),
  random = Math.random,
} = {}) {
  if (typeof patchOrbRuntime !== "function" || typeof getOrbRuntime !== "function") return;
  const ttlCandidate = Number(grace && grace.ttlMs);
  const dur = Math.max(50, ttlCandidate || Number(durationMs) || Number(defaultTtlMs) || 2500);
  const orbRuntime = getOrbRuntime();
  patchOrbRuntime({
    floatGraceActive: true,
    floatGraceUntilMs: Number(nowMs) + dur,
    floatGraceAnchorY: Number(orbRuntime && orbRuntime.yW) || 0,
    floatGracePhase: (typeof random === "function" ? random() : Math.random()) * Math.PI * 2,
  });
}

export function isOrbGraceActiveRuntime({
  getOrbRuntime,
  clearOrbGrace,
  nowMs,
} = {}) {
  if (typeof getOrbRuntime !== "function") return false;
  const orbRt = getOrbRuntime();
  if (!orbRt || !orbRt.floatGraceActive) return false;
  if ((Number(nowMs) || 0) <= Number(orbRt.floatGraceUntilMs || 0)) return true;
  if (typeof clearOrbGrace === "function") clearOrbGrace();
  return false;
}
