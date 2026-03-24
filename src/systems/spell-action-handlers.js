import {
  EVT_SPELL_SLOT_CAST_REQUESTED,
  EVT_SPELL_SLOT_LOAD_REQUESTED,
} from "../contracts/events.js";

export function createSpellActionHandlers({
  eventBus,
  playElectricAoe,
  playFlameAoe,
  playFrostAoe,
  teleportOrbToSpawnNeutralizePhysics,
  executeTeleportHome,
  activateSanctusShield,
  grantSuperGrace,
  domusTeleportAboveGroundPx = 300,
  sanctusShieldMs = 8000,
} = {}){
  function normalizeSlot(slotRaw) {
    const slot = String(slotRaw || "").trim().toUpperCase();
    return slot === "UD" || slot === "LR" || slot === "FB" ? slot : "";
  }

  function requestSlotLoad(slotRaw, payload = {}) {
    if (!eventBus || typeof eventBus.emit !== "function") return;
    const slot = normalizeSlot(slotRaw);
    if (!slot) return;
    eventBus.emit(EVT_SPELL_SLOT_LOAD_REQUESTED, {
      ...(payload && typeof payload === "object" ? payload : {}),
      slot,
      atMs: Number(payload && payload.atMs) || Date.now(),
    });
  }

  function requestSlotCast(slotRaw, payload = {}) {
    if (!eventBus || typeof eventBus.emit !== "function") return;
    const slot = normalizeSlot(slotRaw);
    if (!slot) return;
    eventBus.emit(EVT_SPELL_SLOT_CAST_REQUESTED, {
      ...(payload && typeof payload === "object" ? payload : {}),
      slot,
      atMs: Number(payload && payload.atMs) || Date.now(),
      trigger: String((payload && payload.trigger) || "rule_engine_loaded_slot"),
      directionGroup: slot,
    });
  }

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
      if (typeof executeTeleportHome === "function") {
        executeTeleportHome({
          teleportOrbToSpawnNeutralizePhysics,
          aboveGroundPx: domusTeleportAboveGroundPx,
        });
        return;
      }
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
    load_spell_ud(payload = {}) {
      requestSlotLoad("UD", payload);
    },
    load_spell_lr(payload = {}) {
      requestSlotLoad("LR", payload);
    },
    load_spell_fb(payload = {}) {
      requestSlotLoad("FB", payload);
    },
    cast_loaded_ud(payload = {}) {
      requestSlotCast("UD", payload);
    },
    cast_loaded_lr(payload = {}) {
      requestSlotCast("LR", payload);
    },
    cast_loaded_fb(payload = {}) {
      requestSlotCast("FB", payload);
    },
  };
}
