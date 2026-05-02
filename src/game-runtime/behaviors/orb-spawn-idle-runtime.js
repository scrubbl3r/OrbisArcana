function readNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function activateOrbSpawnIdleRuntime({
  getOrbRuntime = () => null,
  patchOrbRuntime = () => null,
  nowMs = performance.now(),
} = {}) {
  if (typeof getOrbRuntime !== "function" || typeof patchOrbRuntime !== "function") {
    return { handled: false };
  }

  const state = getOrbRuntime();
  if (!state) return { handled: false };

  const xW = readNumber(state.xW, 0);
  const yW = readNumber(state.yW, 0);
  patchOrbRuntime({
    xW,
    yW,
    v: 0,
    vx: 0,
    steerIntentX: 0,
    steerActive: false,
    onGround: false,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceActive: false,
    floatGraceUntilMs: 0,
    floatGraceAnchorY: yW,
    floatGracePhase: 0,
    teleportHoldActive: false,
    teleportHoldAnchorY: yW,
    spawnHoldActive: true,
    spawnHoldAnchorX: xW,
    spawnHoldAnchorY: yW,
    spawnHoldStartedAtMs: readNumber(nowMs, performance.now()),
  });
  return { handled: true, xW, yW };
}
