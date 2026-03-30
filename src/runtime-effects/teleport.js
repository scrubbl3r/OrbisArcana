/**
 * Canonical teleport runtime effect implementation.
 * Keeps movement behavior out of receiver wiring code.
 */
export function executeTeleport({
  teleportOrbToSpawnNeutralizePhysics,
  aboveGroundPx = 0,
} = {}) {
  if (typeof teleportOrbToSpawnNeutralizePhysics !== "function") {
    return { handled: false };
  }
  teleportOrbToSpawnNeutralizePhysics(aboveGroundPx);
  return { handled: true };
}

export function teleportOrbRuntimeToSpawn({
  patchOrbRuntime,
  applyOrbTransform,
  worldSystem,
  groundCenterWorld,
  phys,
  aboveGroundPx = 0,
  nowMs = performance.now(),
  updateDebugReadout,
} = {}) {
  if (
    typeof patchOrbRuntime !== "function"
    || typeof applyOrbTransform !== "function"
    || typeof groundCenterWorld !== "function"
    || !phys
  ) {
    return { handled: false };
  }

  const yFloor = Number(groundCenterWorld()) || 0;
  const yCeil = Number(phys.orbRadiusPx) || 0;
  const lift = Math.max(0, Number(aboveGroundPx) || 0);
  const yTarget = Math.min(yFloor, Math.max(yCeil, yFloor - lift));
  const onGround = !(yTarget < (yFloor - 0.5));

  patchOrbRuntime({
    yW: yTarget,
    v: 0,
    onGround,
    descendMs: 0,
    shieldDescentBlocked: false,
    floatGraceAnchorY: yTarget,
    floatGracePhase: 0,
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
