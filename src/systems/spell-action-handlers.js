import {
  EVT_SPELL_SLOT_CAST_REQUESTED,
} from "../contracts/events.js";

export function createSpellActionHandlers({
  eventBus,
  playElectricAoe,
  playFlameAoe,
  playFrostAoe,
  teleportOrbToSpawnNeutralizePhysics,
  executeTeleportHome,
  executeShockwave,
  triggerShockwave,
  activateSanctusShield,
  grantSuperGrace,
  domusTeleportAboveGroundPx = 300,
  sanctusShieldMs = 8000,
} = {}){
  function normalizeSlot(slotRaw) {
    const slot = String(slotRaw || "").trim().toUpperCase();
    return slot === "UD" || slot === "LR" || slot === "FB" ? slot : "";
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
    teleport(payload = {}) {
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
    domus_teleport_orb(payload = {}) {
      return this.teleport(payload);
    },
    trigger_shockwave(payload = {}) {
      void payload;
      if (typeof executeShockwave === "function") {
        executeShockwave({ triggerShockwave });
        return;
      }
      if (typeof triggerShockwave === "function") {
        triggerShockwave();
      }
    },
    bubble_shield(payload = {}) {
      if (typeof activateSanctusShield === "function") {
        activateSanctusShield((payload && payload.axis) || "y", sanctusShieldMs);
      }
    },
    activate_sanctum_shield(payload = {}) {
      return this.bubble_shield(payload);
    },
    float_grace(payload = {}) {
      const ms = Number(payload && payload.ms);
      if (typeof grantSuperGrace === "function") {
        grantSuperGrace(Number.isFinite(ms) ? ms : undefined);
      }
    },
    grant_orb_super_grace(payload = {}) {
      return this.float_grace(payload);
    },
    colorize(payload = {}) {
      void payload;
      // Stub only for now. Real orb color effect wiring will land in runtime-effects.
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
