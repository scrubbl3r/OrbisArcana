import {
  EVT_SPELL_SLOT_CAST_REQUESTED,
} from "../../contracts/events.js";

export function createSpellActionHandlers({
  eventBus,
  playElectricAoe,
  playFlameAoe,
  playFrostAoe,
  playTeleport,
  teleportOrbToSpawnNeutralizePhysics,
  executeAoeElectric,
  executeAoeFlame,
  executeAoeFrost,
  executeTeleport,
  executeShockwave,
  executeBubbleShield,
  executeColorize,
  triggerShockwave,
  activateBubbleShield,
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
      if (typeof executeAoeElectric !== "function") return;
      executeAoeElectric({ playElectricAoe });
    },
    play_flame_aoe(payload = {}) {
      void payload;
      if (typeof executeAoeFlame !== "function") return;
      executeAoeFlame({ playFlameAoe });
    },
    play_frost_aoe(payload = {}) {
      void payload;
      if (typeof executeAoeFrost !== "function") return;
      executeAoeFrost({ playFrostAoe, playFlameAoe });
    },
    teleport(payload = {}, context = {}) {
      void payload;
      if (typeof executeTeleport !== "function") return;
      if (context && typeof context.deferGrace === "function" && payload && payload.grace) {
        context.deferGrace();
      }
      executeTeleport({
        playTeleport,
        teleportOrbToSpawnNeutralizePhysics,
        aboveGroundPx: domusTeleportAboveGroundPx,
      });
    },
    trigger_shockwave(payload = {}) {
      void payload;
      if (typeof executeShockwave !== "function") return;
      executeShockwave({ triggerShockwave });
    },
    bubble_shield(payload = {}) {
      const durationMs = Number(payload && payload.durationMs);
      if (typeof executeBubbleShield !== "function") return;
      executeBubbleShield({
        activateBubbleShield,
        durationMs: Number.isFinite(durationMs) ? durationMs : bubbleShieldMs,
      });
    },
    colorize(payload = {}) {
      if (typeof executeColorize !== "function") return;
      executeColorize({
        applyColorize,
        clearColorize,
        payload,
      });
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
