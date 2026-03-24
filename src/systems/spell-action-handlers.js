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
  const loadedBySlot = {
    UD: null,
    LR: null,
    FB: null,
  };
  const inferredAxisWordBySpellId = Object.freeze({
    aoe_flame: "pyro",
    aoe_frost: "fridgis",
    aoe_electric: "electrum",
  });

  function normalizeSlot(slotRaw) {
    const slot = String(slotRaw || "").trim().toUpperCase();
    return slot === "UD" || slot === "LR" || slot === "FB" ? slot : "";
  }

  function emitLoadedSpell(slotRaw, payload = {}) {
    if (!eventBus || typeof eventBus.emit !== "function") return;
    const slot = normalizeSlot(slotRaw);
    if (!slot) return;
    const wordId = String((payload && (payload.wordId || payload.spellId || payload.spell)) || "").trim().toLowerCase();
    if (!wordId) return;
    const castActionId = String((payload && (payload.castActionId || payload.spell)) || "").trim().toLowerCase();
    const axis = String((payload && payload.axis) || "y").trim().toLowerCase();
    const explicitAxisWord = String((payload && (payload.axisWord || payload.axisSpell)) || "").trim().toLowerCase();
    const inferredAxisWord = String(inferredAxisWordBySpellId[castActionId] || inferredAxisWordBySpellId[wordId] || "").trim().toLowerCase();
    const loaded = {
      wordId,
      spellId: wordId,
      castActionId: castActionId || wordId,
      slot,
      axis: axis || "y",
      loadedAtMs: Number(payload && payload.atMs) || Date.now(),
      axisWord: explicitAxisWord || inferredAxisWord,
      wakeWindowSpell: String((payload && payload.wakeWindowSpell) || "").trim().toLowerCase(),
    };
    loadedBySlot[slot] = loaded;
    eventBus.emit("voice.spell_loaded", {
      wordId: loaded.wordId,
      spellId: loaded.spellId,
      castActionId: loaded.castActionId,
      axis: loaded.axis,
      slot: loaded.slot,
      axisWord: loaded.axisWord,
      axisSpell: loaded.axisWord,
      wakeWindowSpell: loaded.wakeWindowSpell,
      atMs: loaded.loadedAtMs,
      trigger: String((payload && payload.trigger) || "rule_engine.event"),
    });
  }

  function emitCastLoadedSpell(slotRaw, payload = {}) {
    if (!eventBus || typeof eventBus.emit !== "function") return;
    const slot = normalizeSlot(slotRaw);
    if (!slot) return;
    const loaded = loadedBySlot[slot];
    if (!loaded || !loaded.wordId) return;
    loadedBySlot[slot] = null;
    eventBus.emit("voice.spell_cast", {
      wordId: loaded.wordId,
      spellId: loaded.spellId,
      castActionId: loaded.castActionId,
      axis: loaded.axis,
      slot: loaded.slot,
      axisWord: loaded.axisWord,
      axisSpell: loaded.axisWord,
      wakeWindowSpell: loaded.wakeWindowSpell,
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
      emitLoadedSpell("UD", payload);
    },
    load_spell_lr(payload = {}) {
      emitLoadedSpell("LR", payload);
    },
    load_spell_fb(payload = {}) {
      emitLoadedSpell("FB", payload);
    },
    cast_loaded_ud(payload = {}) {
      emitCastLoadedSpell("UD", payload);
    },
    cast_loaded_lr(payload = {}) {
      emitCastLoadedSpell("LR", payload);
    },
    cast_loaded_fb(payload = {}) {
      emitCastLoadedSpell("FB", payload);
    },
  };
}
