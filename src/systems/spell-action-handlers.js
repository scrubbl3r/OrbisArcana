export function createSpellActionHandlers({
  playElectricAoe,
  playFlameAoe,
  playFrostAoe,
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
    play_frost_aoe(payload = {}) {
      void payload;
      if (typeof playFrostAoe === "function") {
        playFrostAoe();
        return;
      }
      // Fallback until dedicated frost VFX runtime is wired.
      if (typeof playFlameAoe === "function") playFlameAoe();
    },
    play_axis_aoe(payload = {}) {
      const axisWord = String((payload && (payload.axisWord || payload.axisSpell)) || "").trim().toLowerCase();
      if (axisWord === "fridgis") {
        if (typeof playFrostAoe === "function") {
          playFrostAoe();
          return;
        }
        if (typeof playFlameAoe === "function") playFlameAoe();
        return;
      }
      if (axisWord === "electrum") {
        if (typeof playElectricAoe === "function") {
          playElectricAoe();
          return;
        }
        if (typeof playFlameAoe === "function") playFlameAoe();
        return;
      }
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
