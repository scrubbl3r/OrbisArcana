export function createSpellActionHandlers({
  playElectricAoe,
  playFlameAoe,
  teleportOrbToSpawnNeutralizePhysics,
  activateSanctusShield,
  grantSuperGrace,
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
    grant_orb_super_grace(payload = {}) {
      const ms = Number(payload && payload.ms);
      if (typeof grantSuperGrace === "function") {
        grantSuperGrace(Number.isFinite(ms) ? ms : undefined);
      }
    },
  };
}
