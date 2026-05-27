export function clearOrbGraceRuntime({
  patchOrbRuntime,
} = {}) {
  if (typeof patchOrbRuntime !== "function") return;
  patchOrbRuntime({
    floatGraceActive: false,
    floatGraceUntilMs: 0,
    floatGracePersistent: false,
    floatGraceSource: "",
    floatGraceSuppressInput: false,
    floatGraceBreakOnLift: true,
    floatGraceBreakOnMotion: true,
    floatGraceStartedAtMs: 0,
    floatGraceMinBreakMs: 0,
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
  const persistent = !!(grace && grace.persistent);
  const dur = persistent ? 0 : Math.max(50, ttlCandidate || Number(durationMs) || Number(defaultTtlMs) || 2500);
  const orbRuntime = getOrbRuntime();
  patchOrbRuntime({
    v: 0,
    onGround: false,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceActive: true,
    floatGraceUntilMs: persistent ? 0 : Number(nowMs) + dur,
    floatGracePersistent: persistent,
    floatGraceSource: String(grace && grace.source || ""),
    floatGraceSuppressInput: !!(grace && grace.suppressInput),
    floatGraceBreakOnLift: grace && grace.breakOnLift !== false,
    floatGraceBreakOnMotion: grace && grace.breakOnMotion !== false,
    floatGraceStartedAtMs: Number(nowMs) || 0,
    floatGraceMinBreakMs: Math.max(0, Number(grace && grace.minBreakMs) || 0),
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
  if (orbRt.floatGracePersistent) return true;
  if ((Number(nowMs) || 0) <= Number(orbRt.floatGraceUntilMs || 0)) return true;
  if (typeof clearOrbGrace === "function") clearOrbGrace();
  return false;
}
