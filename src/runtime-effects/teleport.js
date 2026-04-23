/**
 * Canonical teleport runtime effect implementation.
 * Keeps movement behavior out of receiver wiring code.
 */
export function executeTeleport({
  playTeleport,
  teleportOrbToSpawnNeutralizePhysics,
  aboveGroundPx = 0,
  onComplete = null,
} = {}) {
  const performTeleport = () => {
    if (typeof teleportOrbToSpawnNeutralizePhysics !== "function") {
      return { handled: false };
    }
    teleportOrbToSpawnNeutralizePhysics({ aboveGroundPx });
    return { handled: true };
  };

  if (typeof playTeleport === "function") {
    const result = playTeleport({
      aboveGroundPx,
      onTeleport: () => performTeleport(),
      onComplete: typeof onComplete === "function" ? onComplete : null,
    });
    if (result && result.handled) {
      return result;
    }
  }
  return performTeleport();
}

export function teleportOrbRuntimeToSpawn({
  patchOrbRuntime,
  applyOrbTransform,
  worldSystem,
  spawnPoint = null,
  resolveSpawnPoint = null,
  groundCenterWorld,
  phys,
  aboveGroundPx = 0,
  nowMs = performance.now(),
  updateDebugReadout,
} = {}) {
  if (
    typeof patchOrbRuntime !== "function"
    || typeof applyOrbTransform !== "function"
    || !phys
  ) {
    return { handled: false };
  }

  const resolvedSpawnPoint = (
    spawnPoint && Number.isFinite(Number(spawnPoint.xW)) && Number.isFinite(Number(spawnPoint.yW))
  )
    ? {
        xW: Number(spawnPoint.xW),
        yW: Number(spawnPoint.yW),
      }
    : (
        typeof resolveSpawnPoint === "function"
          ? resolveSpawnPoint()
          : null
      );
  const yFloor = typeof groundCenterWorld === "function" ? (Number(groundCenterWorld()) || 0) : 0;
  const yCeil = Number(phys.orbRadiusPx) || 0;
  const lift = Math.max(0, Number(aboveGroundPx) || 0);
  const hasResolvedSpawn = resolvedSpawnPoint
    && Number.isFinite(Number(resolvedSpawnPoint.xW))
    && Number.isFinite(Number(resolvedSpawnPoint.yW));
  const xTarget = hasResolvedSpawn ? Number(resolvedSpawnPoint.xW) : null;
  const yTarget = hasResolvedSpawn
    ? Math.max(yCeil, Number(resolvedSpawnPoint.yW) - lift)
    : Math.min(yFloor, Math.max(yCeil, yFloor - lift));
  const onGround = hasResolvedSpawn ? false : !(yTarget < (yFloor - 0.5));

  patchOrbRuntime({
    ...(xTarget == null ? {} : { xW: xTarget }),
    yW: yTarget,
    v: 0,
    vx: 0,
    steerIntentX: 0,
    steerActive: false,
    onGround,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceAnchorY: yTarget,
    floatGracePhase: 0,
    teleportHoldAnchorY: yTarget,
  });
  applyOrbTransform();
  if (worldSystem && typeof worldSystem.render === "function") {
    worldSystem.render(Number(nowMs) || performance.now());
  }
  if (typeof updateDebugReadout === "function") {
    updateDebugReadout();
  }
  return { handled: true, yTarget, onGround };
}
