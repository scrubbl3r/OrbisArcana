export function createSpellActionHandlers({
  playElectricAoe,
  playFlameAoe,
  teleportOrbToSpawnNeutralizePhysics,
  activateSanctusShield,
  domusTeleportAboveGroundPx = 300,
  sanctusShieldMs = 8000,
} = {}){
  return {
    play_electric_aoe(payload = {}) {
      void payload;
      if (typeof playElectricAoe === "function") playElectricAoe();
    },
    play_flame_aoe(payload = {}) {
      void payload;
      if (typeof playFlameAoe === "function") playFlameAoe();
    },
    domus_teleport_orb(payload = {}) {
      void payload;
      if (typeof teleportOrbToSpawnNeutralizePhysics === "function") {
        teleportOrbToSpawnNeutralizePhysics(domusTeleportAboveGroundPx);
      }
    },
    activate_sanctum_shield(payload = {}) {
      if (typeof activateSanctusShield === "function") {
        activateSanctusShield((payload && payload.axis) || "y", sanctusShieldMs);
      }
    },
  };
}

