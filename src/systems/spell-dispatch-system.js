import { ACTIVE_WORDS_BY_ID } from "../voice/wordbook.js";
import {
  WORD_RUNTIME_ROUTING_BY_WORD_ID,
  WORD_WINDOW_BYPASS_WORD_IDS,
  RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS,
} from "../content/spells/spell-runtime-routing.js";
import {
  EVT_SPELL_WINDOW_SPIN_OPENED,
  EVT_SPELL_WINDOW_SPIN_CLOSED,
  EVT_ORB_DIED,
  EVT_ORB_REVIVED,
  EVT_VOICE_WORD_DETECTED,
  EVT_VOICE_SPELL_DETECTED,
  EVT_VOICE_SPELL_REJECTED,
  EVT_VOICE_SPELL_LOADED,
  EVT_VOICE_SPELL_CAST,
  EVT_INPUT_SHAKE_TRIGGERED,
  EVT_SPELL_SLOT_LOAD_REQUESTED,
  EVT_SPELL_SLOT_CAST_REQUESTED,
} from "../contracts/events.js";

// `resources` is an optional injected domain API.
// Expected methods (subset used here):
// - getStoredGlobeCount(): number
// - consumeStoredGlobe(payload): { ok: boolean, stored: number }
export function createSpellDispatchSystem({
  eventBus,
  nowMs = () => Date.now(),
  resources = null,
  ruleEngineEnabled = true,
  baseSpellBySlot = null,
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createSpellDispatchSystem requires eventBus.on/eventBus.emit");
  }

  const unsub = [];
  const lastCastByWordId = new Map();
  const SLOT_ORDER = ["UD", "LR", "FB"];
  const TEMP_UNGATED_WORD_IDS = new Set(
    (Array.isArray(WORD_WINDOW_BYPASS_WORD_IDS) ? WORD_WINDOW_BYPASS_WORD_IDS : [])
      .map((id) => String(id || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const RULE_ENGINE_OWNED_IMMEDIATE_IDS = new Set(
    (Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS) ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS : [])
      .map((id) => String(id || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const resolvedBaseSpellBySlot = Object.freeze({
    UD: String((baseSpellBySlot && baseSpellBySlot.UD) || "shockwave").trim().toLowerCase(),
    LR: String((baseSpellBySlot && baseSpellBySlot.LR) || "shockwave").trim().toLowerCase(),
    FB: String((baseSpellBySlot && baseSpellBySlot.FB) || "shockwave").trim().toLowerCase(),
  });
  const loadedBySlot = { UD: null, LR: null, FB: null };
  let nextSlotIndex = 0;
  let lastVoiceDetectDedupeKey = "";
  let lastVoiceDetectDedupeAtMs = 0;

  function getStoredGlobeCount() {
    if (resources && typeof resources.getStoredGlobeCount === "function") {
      return Math.max(0, Number(resources.getStoredGlobeCount()) || 0);
    }
    return 0;
  }

  function consumeStoredGlobe(payload = {}) {
    if (resources && typeof resources.consumeStoredGlobe === "function") {
      return resources.consumeStoredGlobe(payload);
    }
    return { ok: false, stored: getStoredGlobeCount() };
  }

  function normAxis(axis) {
    const a = String(axis || "").trim().toLowerCase();
    return a === "x" || a === "y" || a === "z" ? a : "";
  }

  function normGroup(group) {
    const g = String(group || "").trim().toUpperCase();
    return SLOT_ORDER.includes(g) ? g : "";
  }

  function canCastSpellNow(spell, now) {
    const wordId = String(spell.id || "");
    const cooldownMs = Math.max(0, Number(spell.cooldownMs) || 0);
    const last = Number(lastCastByWordId.get(wordId) || 0);
    const elapsed = now - last;
    if (cooldownMs > 0 && elapsed < cooldownMs) {
      return {
        ok: false,
        remainingMs: Math.max(0, cooldownMs - elapsed),
        cooldownMs,
      };
    }
    return { ok: true, cooldownMs: 0, remainingMs: 0 };
  }

  function reserveNextSlot() {
    const idx = Number(nextSlotIndex || 0);
    const slot = SLOT_ORDER[idx % SLOT_ORDER.length];
    nextSlotIndex = idx + 1;
    return slot;
  }

  function pickSlotForLoad(spell) {
    const fixed = normGroup(spell && spell.fixedSlot);
    if (fixed) return fixed;
    return reserveNextSlot();
  }

  function mostRecentLoadedForGroup(group) {
    const slot = normGroup(group);
    if (!slot || !loadedBySlot[slot]) return null;
    return Object.assign({ slot }, loadedBySlot[slot]);
  }

  function mostRecentLoadedAny() {
    let best = null;
    for (const slot of SLOT_ORDER) {
      const entry = loadedBySlot[slot];
      if (!entry) continue;
      if (!best || Number(entry.loadedAtMs) > Number(best.loadedAtMs)) {
        best = Object.assign({ slot }, entry);
      }
    }
    return best;
  }

  function buildBaseEntryForSlot(slotRaw, payload = {}) {
    const slot = normGroup(slotRaw);
    if (!slot) return null;
    const wordId = String(resolvedBaseSpellBySlot[slot] || "").trim().toLowerCase();
    if (!wordId) return null;
    const routed = withRuntimeRouting(ACTIVE_WORDS_BY_ID[wordId] || { id: wordId });
    return {
      wordId,
      spellId: wordId,
      castActionId: String((payload.castActionId || routed.castActionId || wordId) || "").trim().toLowerCase(),
      intent: String((payload.intent || routed.intent) || ""),
      phrase: String((payload.phrase || routed.phrase || wordId) || ""),
      cooldownMs: Math.max(0, Number(payload.cooldownMs ?? routed.cooldownMs) || 0),
      confidence: Number(payload.confidence) || 0,
      loadedAtMs: Number(payload.atMs) || nowMs(),
      slot,
      axis: normAxis(payload.axis),
      resident: "base",
    };
  }

  function withRuntimeRouting(spell = {}) {
    const id = String(spell && spell.id || "").toLowerCase();
    const routing = WORD_RUNTIME_ROUTING_BY_WORD_ID[id] || null;
    if (!routing) return spell;
    return {
      ...spell,
      ...routing,
    };
  }

  function buildLoadedEntryFromPayload(payload = {}, slotOverride = "") {
    const slot = normGroup(slotOverride || payload.slot);
    const wordId = String((payload.wordId || payload.spellId || payload.spell) || "").trim().toLowerCase();
    if (!slot || !wordId) return null;
    const routed = withRuntimeRouting(ACTIVE_WORDS_BY_ID[wordId] || { id: wordId });
    return {
      wordId,
      spellId: wordId,
      castActionId: String((payload.castActionId || payload.spell || routed.castActionId || wordId) || "").trim().toLowerCase(),
      intent: String((payload.intent || routed.intent) || ""),
      phrase: String((payload.phrase || routed.phrase || wordId) || ""),
      cooldownMs: Math.max(0, Number(payload.cooldownMs ?? routed.cooldownMs) || 0),
      confidence: Number(payload.confidence) || 0,
      loadedAtMs: Number(payload.atMs) || nowMs(),
      slot,
      axis: normAxis(payload.axis),
      resident: "loaded",
    };
  }

  function emitSpellLoadedFromEntry(entry, trigger = "rule_engine.event") {
    eventBus.emit(EVT_VOICE_SPELL_LOADED, {
      wordId: entry.wordId,
      spellId: entry.spellId,
      castActionId: entry.castActionId,
      intent: entry.intent,
      phrase: entry.phrase,
      confidence: Number(entry.confidence) || 0,
      axis: entry.axis,
      slot: entry.slot,
      atMs: entry.loadedAtMs,
      trigger,
    });
  }

  function emitSpellCastFromEntry(entry, payload = {}) {
    const now = Number(payload.atMs) || nowMs();
    /** @type {import("../contracts/events.js").VoiceSpellCastPayload} */
    const castPayload = {
      wordId: entry.wordId,
      spellId: entry.spellId,
      castActionId: entry.castActionId,
      intent: entry.intent,
      phrase: entry.phrase,
      confidence: Number(entry.confidence) || 0,
      trigger: String(payload.trigger || "shake_detonation"),
      axis: entry.axis,
      slot: entry.slot,
      directionGroup: String(payload.directionGroup || entry.slot || ""),
      atMs: now,
    };
    eventBus.emit(EVT_VOICE_SPELL_CAST, castPayload);
  }

  function loadSlot(slotRaw, payload = {}) {
    const entry = buildLoadedEntryFromPayload(payload, slotRaw);
    if (!entry) return null;
    loadedBySlot[entry.slot] = {
      wordId: entry.wordId,
      spellId: entry.spellId,
      castActionId: entry.castActionId,
      intent: entry.intent,
      phrase: entry.phrase,
      cooldownMs: entry.cooldownMs,
      confidence: entry.confidence,
      loadedAtMs: entry.loadedAtMs,
      axis: entry.axis,
    };
    emitSpellLoadedFromEntry(entry, String(payload.trigger || "rule_engine.event"));
    return entry;
  }

  function castSlot(slotRaw, payload = {}) {
    const slot = normGroup(slotRaw);
    if (!slot) return null;
    const loaded = mostRecentLoadedForGroup(slot);
    const entry = (loaded && loaded.wordId) ? loaded : buildBaseEntryForSlot(slot, payload);
    if (!entry || !entry.wordId) return null;
    const now = Number(payload.atMs) || nowMs();
    const spell = {
      id: String(entry.wordId || ""),
      cooldownMs: Math.max(0, Number(entry.cooldownMs) || 0),
    };
    const castCheck = canCastSpellNow(spell, now);
    if (!castCheck.ok) {
      eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
        reason: "cooldown",
        wordId: spell.id,
        spellId: spell.id,
        cooldownMs: castCheck.cooldownMs,
        remainingMs: castCheck.remainingMs,
        atMs: now,
      });
      return null;
    }
    if (entry.resident === "loaded") {
      loadedBySlot[entry.slot] = null;
    }
    lastCastByWordId.set(spell.id, now);
    emitSpellCastFromEntry(entry, {
      ...payload,
      atMs: now,
      directionGroup: String(payload.directionGroup || slot),
    });
    return entry;
  }

  function start() {
    unsub.push(eventBus.on(EVT_SPELL_WINDOW_SPIN_OPENED, () => {}));
    unsub.push(eventBus.on(EVT_SPELL_WINDOW_SPIN_CLOSED, () => {}));

    unsub.push(eventBus.on(EVT_ORB_DIED, () => {
      reset();
    }));
    unsub.push(eventBus.on(EVT_ORB_REVIVED, () => {
      reset();
    }));

    function onVoiceDetected(payload = {}) {
      // When the rule engine is active, authored gameplay chains own voice recognition/load semantics.
      // Dispatch remains the slot/shake owner and should not compete by consuming words directly.
      if (ruleEngineEnabled) return;
      const detected = (payload && typeof payload === "object")
        ? (payload.spell || payload.word || {})
        : {};
      const spell = withRuntimeRouting(detected || {});
      const rawWordId = String(spell.id || "");
      const wordId = rawWordId;
      if (!wordId) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "invalid_spell",
          atMs: nowMs(),
        });
        return;
      }
      const now = nowMs();
      const atMs = Number(payload && payload.atMs);
      const detectAtMs = Number.isFinite(atMs) ? Math.floor(atMs) : Math.floor(now);
      const confidenceBucket = Number.isFinite(Number(payload && payload.confidence))
        ? Math.round(Number(payload.confidence) * 1000)
        : -1;
      const dedupeKey = `${wordId}|${detectAtMs}|${confidenceBucket}`;
      if (
        dedupeKey &&
        dedupeKey === lastVoiceDetectDedupeKey &&
        (now - Number(lastVoiceDetectDedupeAtMs || 0)) <= 50
      ) {
        return;
      }
      lastVoiceDetectDedupeKey = dedupeKey;
      lastVoiceDetectDedupeAtMs = now;
      if (!ACTIVE_WORDS_BY_ID[String(wordId || "").toLowerCase()]) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "spell_inactive",
          wordId,
          spellId: wordId,
          atMs: now,
        });
        return;
      }

      const castCheck = canCastSpellNow(spell, now);
      if (!castCheck.ok) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "cooldown",
          wordId,
          spellId: wordId,
          cooldownMs: castCheck.cooldownMs,
          remainingMs: castCheck.remainingMs,
          atMs: now,
        });
        return;
      }
      if (ruleEngineEnabled && RULE_ENGINE_OWNED_IMMEDIATE_IDS.has(wordId)) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "rule_engine_owned_immediate_spell",
          wordId,
          spellId: wordId,
          atMs: now,
        });
        return;
      }
      lastCastByWordId.set(wordId, now);
      /** @type {import("../contracts/events.js").VoiceSpellCastPayload} */
      const castPayload = {
        wordId,
        spellId: wordId,
        intent: spell.intent,
        phrase: spell.phrase,
        confidence: Number(payload.confidence) || 0,
        trigger: "voice_immediate",
        atMs: now,
      };
      eventBus.emit(EVT_VOICE_SPELL_CAST, castPayload);
    }
    unsub.push(eventBus.on(EVT_VOICE_SPELL_DETECTED, onVoiceDetected));
    unsub.push(eventBus.on(EVT_VOICE_WORD_DETECTED, onVoiceDetected));

    unsub.push(eventBus.on(EVT_SPELL_SLOT_LOAD_REQUESTED, (payload = {}) => {
      loadSlot(payload.slot, payload);
    }));

    unsub.push(eventBus.on(EVT_SPELL_SLOT_CAST_REQUESTED, (payload = {}) => {
      castSlot(payload.slot, payload);
    }));

    unsub.push(eventBus.on(EVT_INPUT_SHAKE_TRIGGERED, (payload = {}) => {
      if (ruleEngineEnabled) return;
      const group = normGroup(payload.group);
      const now = nowMs();

      let entry = null;
      if (group) {
        entry = mostRecentLoadedForGroup(group) || buildBaseEntryForSlot(group, payload);
      } else {
        // Directionless shake fallback: detonate the most recently loaded slot.
        entry = mostRecentLoadedAny();
      }
      if (!entry) return;
      const loadedWordId = String(entry.wordId || "");
      if (!loadedWordId) return;

      const spell = {
        id: loadedWordId,
        cooldownMs: Math.max(0, Number(entry.cooldownMs) || 0),
      };
      const castCheck = canCastSpellNow(spell, now);
      if (!castCheck.ok) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "cooldown",
          wordId: loadedWordId,
          spellId: loadedWordId,
          cooldownMs: castCheck.cooldownMs,
          remainingMs: castCheck.remainingMs,
          atMs: now,
        });
        return;
      }

      if (entry.resident === "loaded") {
        loadedBySlot[entry.slot] = null;
      }
      lastCastByWordId.set(loadedWordId, now);
      emitSpellCastFromEntry(entry, {
        trigger: "shake_detonation",
        directionGroup: group || String(entry.slot || ""),
        atMs: now,
      });
    }));
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  function reset() {
    lastCastByWordId.clear();
    lastVoiceDetectDedupeKey = "";
    lastVoiceDetectDedupeAtMs = 0;
    nextSlotIndex = 0;
    for (const slot of SLOT_ORDER) {
      loadedBySlot[slot] = null;
    }
  }

  return {
    start,
    stop,
    reset,
  };
}
