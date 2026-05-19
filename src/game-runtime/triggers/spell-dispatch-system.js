import { ACTIVE_WORDS_BY_ID } from "../../voice/wordbook.js";
import { getOrbCastGateState as getSharedOrbCastGateState } from "../orb/orb-cast-policy.js";
import {
  WORD_RUNTIME_ROUTING_BY_WORD_ID,
  WORD_WINDOW_BYPASS_WORD_IDS,
  RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS,
} from "../../content/spells/spell-runtime-routing.js?v=20260519pyromodula";
import { getCastActionMeta } from "../../content/spells/cast-action-registry.js";
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
} from "../../contracts/events.js";

// `resources` is an optional injected domain API.
// Expected methods (subset used here):
// - getStoredGlobeCount(): number
// - bindLoadedGlobe(payload): { ok: boolean, stored: number, globe?: Object }
// - spendBoundGlobe(payload): { ok: boolean, stored: number, globe?: Object }
// - consumeStoredGlobe(payload): { ok: boolean, stored: number, globe?: Object }
export function createSpellDispatchSystem({
  eventBus,
  nowMs = () => Date.now(),
  resources = null,
  getOrbCastGateState = () => getSharedOrbCastGateState(null),
  ruleEngineEnabled = true,
  allowLegacyFallbacks = false,
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

  function normalizeWordId(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isKnownRuntimeWordId(value) {
    const wordId = normalizeWordId(value);
    return !!wordId && Object.prototype.hasOwnProperty.call(ACTIVE_WORDS_BY_ID, wordId);
  }

  function resolveEntryIdentity(entry = {}) {
    return normalizeWordId(entry.sourceWordId || entry.wordId || entry.castActionId || "");
  }

  function legacyFallbacksEnabled() {
    return !ruleEngineEnabled && allowLegacyFallbacks === true;
  }

  function resolveCastGateState() {
    const gateState = (typeof getOrbCastGateState === "function")
      ? (getOrbCastGateState() || null)
      : null;
    if (gateState && typeof gateState === "object" && Object.prototype.hasOwnProperty.call(gateState, "allowed")) {
      return {
        allowed: gateState.allowed !== false,
        reason: String(gateState.reason || ""),
      };
    }
    return { allowed: true, reason: "" };
  }

  function emitCastBlocked(payload = {}, reason = "") {
    const now = Number(payload.atMs) || nowMs();
    eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
      reason: String(reason || "blocked"),
      wordId: String((payload.wordId || payload.spellId || payload.spell) || ""),
      spellId: String((payload.spellId || payload.wordId || payload.spell) || ""),
      slot: String(payload.slot || ""),
      axis: String(payload.axis || ""),
      atMs: now,
    });
  }

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

  function bindLoadedGlobe(payload = {}) {
    if (resources && typeof resources.bindLoadedGlobe === "function") {
      return resources.bindLoadedGlobe(payload);
    }
    return consumeStoredGlobe(payload);
  }

  function spendBoundGlobe(payload = {}) {
    if (resources && typeof resources.spendBoundGlobe === "function") {
      return resources.spendBoundGlobe(payload);
    }
    return { ok: true, stored: getStoredGlobeCount() };
  }

  function getGlobeCostForCastAction(castActionId) {
    const meta = getCastActionMeta(castActionId);
    return Math.max(0, Number(meta && meta.globeCost) || 0);
  }

  function tryConsumeSpellCost(entry, payload = {}) {
    const castActionId = String(entry && entry.castActionId || "").trim().toLowerCase();
    const globeCost = getGlobeCostForCastAction(castActionId);
    if (globeCost <= 0) {
      return { ok: true, globeCost: 0, stored: getStoredGlobeCount() };
    }
    const before = getStoredGlobeCount();
    if (before < globeCost) {
      return { ok: false, globeCost, stored: before };
    }
    let stored = before;
    for (let i = 0; i < globeCost; i += 1) {
      const result = consumeStoredGlobe({
        ...payload,
        reason: String(payload.reason || "spell_cast"),
        wordId: String(entry.sourceWordId || entry.wordId || ""),
        spellId: String(entry.sourceWordId || entry.spellId || entry.wordId || ""),
        slot: String(entry.slot || payload.slot || ""),
        axis: String(entry.axis || payload.axis || ""),
      });
      if (!result || result.ok !== true) {
        return { ok: false, globeCost, stored: getStoredGlobeCount() };
      }
      stored = Math.max(0, Number(result.stored) || 0);
    }
    return { ok: true, globeCost, stored };
  }

  function tryBindSpellCost(entry, payload = {}) {
    const castActionId = String(entry && entry.castActionId || "").trim().toLowerCase();
    const globeCost = getGlobeCostForCastAction(castActionId);
    if (globeCost <= 0) {
      return { ok: true, globeCost: 0, stored: getStoredGlobeCount(), globes: [] };
    }
    const before = getStoredGlobeCount();
    if (before < globeCost) {
      return { ok: false, globeCost, stored: before, globes: [] };
    }
    const globes = [];
    let stored = before;
    for (let i = 0; i < globeCost; i += 1) {
      const result = bindLoadedGlobe({
        ...payload,
        reason: String(payload.reason || "slot_load"),
        wordId: String(entry.sourceWordId || entry.wordId || ""),
        spellId: String(entry.sourceWordId || entry.spellId || entry.wordId || ""),
        slot: String(entry.slot || payload.slot || ""),
        axis: String(entry.axis || payload.axis || ""),
      });
      if (!result || result.ok !== true) {
        return { ok: false, globeCost, stored: getStoredGlobeCount(), globes };
      }
      stored = Math.max(0, Number(result.stored) || 0);
      if (result.globe) globes.push({ ...result.globe });
    }
    return { ok: true, globeCost, stored, globes, globe: globes[0] || null };
  }

  function emitInsufficientGlobes(entry, payload = {}, globeCost = 0, stored = 0) {
    const now = Number(payload.atMs) || nowMs();
    eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
      reason: "insufficient_globes",
      wordId: String(entry && entry.wordId || ""),
      spellId: String(entry && (entry.spellId || entry.wordId) || ""),
      slot: String(entry && entry.slot || payload.slot || ""),
      axis: String(entry && entry.axis || payload.axis || ""),
      requiredGlobes: Math.max(0, Number(globeCost) || 0),
      storedGlobes: Math.max(0, Number(stored) || 0),
      atMs: now,
    });
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
    const wordId = resolveEntryIdentity(spell);
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
      sourceWordId: wordId,
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
    const explicitSourceWordId = normalizeWordId(payload.sourceWordId || payload.wordId || payload.spellId || "");
    const rawSpellToken = normalizeWordId(payload.spell || payload.castActionId || explicitSourceWordId);
    const sourceWordId = isKnownRuntimeWordId(explicitSourceWordId)
      ? explicitSourceWordId
      : isKnownRuntimeWordId(rawSpellToken)
        ? rawSpellToken
        : "";
    const routed = sourceWordId
      ? withRuntimeRouting(ACTIVE_WORDS_BY_ID[sourceWordId] || { id: sourceWordId })
      : Object.create(null);
    const castActionId = String(
      (payload.castActionId || routed.castActionId || rawSpellToken || sourceWordId) || ""
    ).trim().toLowerCase();
    if (!slot || !castActionId) return null;
    return {
      wordId: sourceWordId || castActionId,
      sourceWordId,
      spellId: sourceWordId || castActionId,
      castActionId,
      intent: String((payload.intent || routed.intent) || ""),
      phrase: String((payload.phrase || routed.phrase || sourceWordId || castActionId) || ""),
      cooldownMs: Math.max(0, Number(payload.cooldownMs ?? routed.cooldownMs) || 0),
      confidence: Number(payload.confidence) || 0,
      loadedAtMs: Number(payload.atMs) || nowMs(),
      slot,
      axis: normAxis(payload.axis),
      resident: "loaded",
      boundGlobeId: payload.boundGlobeId ? String(payload.boundGlobeId) : "",
      emitterId: payload.emitterId ? String(payload.emitterId) : "",
    };
  }

  function emitSpellLoadedFromEntry(entry, trigger = "rule_engine.event") {
    eventBus.emit(EVT_VOICE_SPELL_LOADED, {
      wordId: entry.wordId,
      sourceWordId: entry.sourceWordId || "",
      spellId: entry.spellId,
      castActionId: entry.castActionId,
      intent: entry.intent,
      phrase: entry.phrase,
      confidence: Number(entry.confidence) || 0,
      axis: entry.axis,
      slot: entry.slot,
      boundGlobeId: entry.boundGlobeId || "",
      globeId: entry.boundGlobeId || "",
      emitterId: entry.emitterId || "",
      atMs: entry.loadedAtMs,
      trigger,
    });
  }

  function emitSpellCastFromEntry(entry, payload = {}) {
    const now = Number(payload.atMs) || nowMs();
    const castPayload = {
      wordId: entry.wordId,
      sourceWordId: entry.sourceWordId || "",
      spellId: entry.spellId,
      castActionId: entry.castActionId,
      intent: entry.intent,
      phrase: entry.phrase,
      confidence: Number(entry.confidence) || 0,
      trigger: String(payload.trigger || "shake_detonation"),
      axis: entry.axis,
      slot: entry.slot,
      boundGlobeId: entry.boundGlobeId || "",
      globeId: entry.boundGlobeId || "",
      emitterId: entry.emitterId || "",
      directionGroup: String(payload.directionGroup || entry.slot || ""),
      atMs: now,
    };
    if (payload.grace && typeof payload.grace === "object" && !Array.isArray(payload.grace)) {
      castPayload.grace = { ...payload.grace };
    }
    eventBus.emit(EVT_VOICE_SPELL_CAST, castPayload);
  }

  function loadSlot(slotRaw, payload = {}) {
    const gateState = resolveCastGateState();
    if (!gateState.allowed) {
      emitCastBlocked({ ...payload, slot: slotRaw }, gateState.reason);
      return null;
    }
    const entry = buildLoadedEntryFromPayload(payload, slotRaw);
    if (!entry) return null;
    const existing = mostRecentLoadedForGroup(entry.slot);
    if (existing && String(existing.wordId || "") === String(entry.wordId || "")) {
      eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
        reason: "slot_already_contains_spell",
        wordId: String(entry.wordId || ""),
        spellId: String(entry.spellId || entry.wordId || ""),
        slot: String(entry.slot || ""),
        axis: String(entry.axis || ""),
        atMs: entry.loadedAtMs,
      });
      return null;
    }
    const costResult = tryBindSpellCost(entry, {
      ...payload,
      atMs: entry.loadedAtMs,
      reason: "slot_load",
    });
    if (!costResult.ok) {
      emitInsufficientGlobes(entry, { ...payload, atMs: entry.loadedAtMs }, costResult.globeCost, costResult.stored);
      return null;
    }
    entry.boundGlobeId = String(costResult.globe && (costResult.globe.globeId || costResult.globe.id) || "");
    entry.emitterId = String(costResult.globe && costResult.globe.emitterId || "");
    loadedBySlot[entry.slot] = {
      wordId: entry.wordId,
      sourceWordId: entry.sourceWordId || "",
      spellId: entry.spellId,
      castActionId: entry.castActionId,
      intent: entry.intent,
      phrase: entry.phrase,
      cooldownMs: entry.cooldownMs,
      confidence: entry.confidence,
      loadedAtMs: entry.loadedAtMs,
      axis: entry.axis,
      boundGlobeId: entry.boundGlobeId,
      emitterId: entry.emitterId,
      resident: "loaded",
    };
    emitSpellLoadedFromEntry(entry, String(payload.trigger || "rule_engine.event"));
    return entry;
  }

  function castSlot(slotRaw, payload = {}) {
    const gateState = resolveCastGateState();
    if (!gateState.allowed) {
      emitCastBlocked({ ...payload, slot: slotRaw }, gateState.reason);
      return null;
    }
    const slot = normGroup(slotRaw);
    if (!slot) return null;
    const loaded = mostRecentLoadedForGroup(slot);
    const entry = (loaded && (loaded.wordId || loaded.castActionId)) ? loaded : buildBaseEntryForSlot(slot, payload);
    if (!entry || !(entry.wordId || entry.castActionId)) return null;
    const now = Number(payload.atMs) || nowMs();
    const spell = {
      id: resolveEntryIdentity(entry),
      sourceWordId: String(entry.sourceWordId || ""),
      wordId: String(entry.wordId || ""),
      castActionId: String(entry.castActionId || ""),
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
      const spendResult = spendBoundGlobe({
        ...payload,
        atMs: now,
        reason: String(payload.reason || "spell_cast"),
        wordId: String(entry.sourceWordId || entry.wordId || ""),
        spellId: String(entry.sourceWordId || entry.spellId || entry.wordId || ""),
        slot: String(entry.slot || slot || ""),
        axis: String(entry.axis || payload.axis || ""),
        boundGlobeId: String(entry.boundGlobeId || ""),
        globeId: String(entry.boundGlobeId || ""),
      });
      if (!spendResult || spendResult.ok !== true) {
        emitInsufficientGlobes(entry, { ...payload, atMs: now }, 1, getStoredGlobeCount());
        return null;
      }
      loadedBySlot[entry.slot] = null;
    }
    lastCastByWordId.set(resolveEntryIdentity(entry), now);
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
      const gateState = resolveCastGateState();
      if (!gateState.allowed) {
        emitCastBlocked(payload, gateState.reason);
        return;
      }
      // When the rule engine is active, authored gameplay chains own voice recognition/load semantics.
      // Dispatch remains the slot/shake owner and should not compete by consuming words directly.
      if (!legacyFallbacksEnabled()) return;
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
      const costResult = tryConsumeSpellCost({
        wordId,
        spellId: wordId,
        castActionId: String(spell.castActionId || wordId || "").trim().toLowerCase(),
        slot: "",
        axis: "",
      }, {
        atMs: now,
        reason: "voice_immediate",
      });
      if (!costResult.ok) {
        emitInsufficientGlobes({
          wordId,
          spellId: wordId,
          castActionId: String(spell.castActionId || wordId || "").trim().toLowerCase(),
        }, { atMs: now }, costResult.globeCost, costResult.stored);
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
      const gateState = resolveCastGateState();
      if (!gateState.allowed) {
        emitCastBlocked(payload, gateState.reason);
        return;
      }
      const group = normGroup(payload.group);
      if (ruleEngineEnabled && group) return;
      if (!ruleEngineEnabled && !legacyFallbacksEnabled()) return;
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
        id: resolveEntryIdentity(entry),
        sourceWordId: String(entry.sourceWordId || ""),
        wordId: loadedWordId,
        castActionId: String(entry.castActionId || ""),
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
      if (entry.resident !== "loaded") {
        const costResult = tryConsumeSpellCost(entry, {
          trigger: "shake_detonation",
          directionGroup: group || String(entry.slot || ""),
          atMs: now,
          reason: "shake_detonation",
        });
        if (!costResult.ok) {
          emitInsufficientGlobes(entry, {
            trigger: "shake_detonation",
            directionGroup: group || String(entry.slot || ""),
            atMs: now,
          }, costResult.globeCost, costResult.stored);
          return;
        }
      }

      if (entry.resident === "loaded") {
        const spendResult = spendBoundGlobe({
          ...payload,
          trigger: "shake_detonation",
          directionGroup: group || String(entry.slot || ""),
          atMs: now,
          reason: "shake_detonation",
          wordId: String(entry.sourceWordId || entry.wordId || ""),
          spellId: String(entry.sourceWordId || entry.spellId || entry.wordId || ""),
          slot: String(entry.slot || group || ""),
          axis: String(entry.axis || payload.axis || ""),
          boundGlobeId: String(entry.boundGlobeId || ""),
          globeId: String(entry.boundGlobeId || ""),
        });
        if (!spendResult || spendResult.ok !== true) {
          emitInsufficientGlobes(entry, {
            trigger: "shake_detonation",
            directionGroup: group || String(entry.slot || ""),
            atMs: now,
          }, 1, getStoredGlobeCount());
          return;
        }
        loadedBySlot[entry.slot] = null;
      }
      lastCastByWordId.set(resolveEntryIdentity(entry), now);
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
