import {
  EVT_SPELL_SLOT_CAST_REQUESTED,
} from "../contracts/events.js";

export function createSpellActionHandlers({
  eventBus,
  playElectricAoe,
  playFlameAoe,
  playFrostAoe,
  teleportOrbToSpawnNeutralizePhysics,
  executeAoeElectric,
  executeAoeFlame,
  executeAoeFrost,
  executeTeleportHome,
  executeShockwave,
  executeBubbleShield,
  executeFloatGrace,
  executeColorize,
  triggerShockwave,
  activateBubbleShield,
  grantSuperGrace,
  applyColorize,
  clearColorize,
  domusTeleportAboveGroundPx = 300,
  bubbleShieldMs = 8000,
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
      if (typeof executeAoeElectric === "function") {
        executeAoeElectric({ playElectricAoe });
        return;
      }
      if (typeof playElectricAoe === "function") playElectricAoe();
    },
    play_flame_aoe(payload = {}) {
      void payload;
      if (typeof executeAoeFlame === "function") {
        executeAoeFlame({ playFlameAoe });
        return;
      }
      if (typeof playFlameAoe === "function") playFlameAoe();
    },
    play_frost_aoe(payload = {}) {
      void payload;
      if (typeof executeAoeFrost === "function") {
        executeAoeFrost({ playFrostAoe, playFlameAoe });
        return;
      }
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
      const durationMs = Number(payload && payload.durationMs);
      if (typeof executeBubbleShield === "function") {
        executeBubbleShield({
          activateBubbleShield,
          durationMs: Number.isFinite(durationMs) ? durationMs : bubbleShieldMs,
        });
        return;
      }
      if (typeof activateBubbleShield === "function") {
        activateBubbleShield({
          durationMs: Number.isFinite(durationMs) ? durationMs : bubbleShieldMs,
        });
      }
    },
    float_grace(payload = {}) {
      const ms = Number(payload && payload.ms);
      if (typeof executeFloatGrace === "function") {
        executeFloatGrace({
          grantSuperGrace,
          ms: Number.isFinite(ms) ? ms : undefined,
        });
        return;
      }
      if (typeof grantSuperGrace === "function") {
        grantSuperGrace(Number.isFinite(ms) ? ms : undefined);
      }
    },
    colorize(payload = {}) {
      if (typeof executeColorize === "function") {
        executeColorize({
          applyColorize,
          clearColorize,
          payload,
        });
      }
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
