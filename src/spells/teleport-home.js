/**
 * Canonical teleport-home spell implementation.
 * Keeps movement behavior out of receiver wiring code.
 */
export function executeTeleportHome({
  teleportOrbToSpawnNeutralizePhysics,
  aboveGroundPx = 0,
} = {}) {
  if (typeof teleportOrbToSpawnNeutralizePhysics !== "function") {
    return { handled: false };
  }
  teleportOrbToSpawnNeutralizePhysics(aboveGroundPx);
  return { handled: true };
}

