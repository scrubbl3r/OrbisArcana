import { ACTIVE_SPELLS_BY_ID } from "../voice/spellbook.js";
import {
  WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN,
  SPELL_RUNTIME_ROUTING_BY_ID,
  SPELL_WINDOW_BYPASS_SPELL_IDS,
} from "../content/spells/spell-runtime-routing-v1.js";
import {
  EVT_SPELL_WINDOW_FLAT_SPIN_OPENED,
  EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED,
  EVT_ORB_DIED,
  EVT_ORB_REVIVED,
  EVT_VOICE_SPELL_DETECTED,
  EVT_VOICE_SPELL_REJECTED,
  EVT_VOICE_AXIS_SELECTED,
  EVT_VOICE_SPELL_LOADED,
  EVT_VOICE_SPELL_CAST,
  EVT_INPUT_SHAKE_TRIGGERED,
} from "../contracts/events.js";

// `resources` is an optional injected domain API.
// Expected methods (subset used here):
// - getStoredGlobeCount(): number
// - consumeStoredGlobe(payload): { ok: boolean, stored: number }
export function createSpellDispatchSystem({ eventBus, nowMs = () => Date.now(), resources = null }) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createSpellDispatchSystem requires eventBus.on/eventBus.emit");
  }

  const unsub = [];
  const lastCastBySpellId = new Map();
  const SLOT_ORDER = ["UD", "LR", "FB"];
  const AXES = ["x", "y", "z"];
  const FLAT_SPIN_DUPLICATE_SUPPRESS_MS = 300;
  const TEMP_UNGATED_SPELL_IDS = new Set(
    (Array.isArray(SPELL_WINDOW_BYPASS_SPELL_IDS) ? SPELL_WINDOW_BYPASS_SPELL_IDS : [])
      .map((id) => String(id || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const loadedByAxis = {
    x: { UD: null, LR: null, FB: null },
    y: { UD: null, LR: null, FB: null },
    z: { UD: null, LR: null, FB: null },
  };
  const lastFlatSpinLoadAtByAxisSpell = new Map();
  const nextSlotIndexByAxis = { x: 0, y: 0, z: 0 };
  let activeFlatSpinAxis = null;
  const selectedAxisSpellByAxis = { x: "", y: "", z: "" };

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
    return AXES.includes(a) ? a : "";
  }

  function normGroup(group) {
    const g = String(group || "").trim().toUpperCase();
    return SLOT_ORDER.includes(g) ? g : "";
  }

  function canCastSpellNow(spell, now) {
    const spellId = String(spell.id || "");
    const cooldownMs = Math.max(0, Number(spell.cooldownMs) || 0);
    const last = Number(lastCastBySpellId.get(spellId) || 0);
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

  function reserveNextSlotForAxis(axis) {
    const idx = Number(nextSlotIndexByAxis[axis] || 0);
    const slot = SLOT_ORDER[idx % SLOT_ORDER.length];
    nextSlotIndexByAxis[axis] = idx + 1;
    return slot;
  }

  function pickSlotForLoad(spell, axis) {
    const a = normAxis(axis);
    const slotByAxis = (spell && typeof spell.slotByAxis === "object" && spell.slotByAxis)
      ? spell.slotByAxis
      : null;
    if (slotByAxis && a) {
      const axisSlot = normGroup(slotByAxis[a]);
      if (axisSlot) return axisSlot;
    }
    const fixed = normGroup(spell && spell.fixedSlot);
    if (fixed) return fixed;
    return reserveNextSlotForAxis(a);
  }

  function applyAxisSlotClearPolicy(spell, axis) {
    const a = normAxis(axis);
    if (!a) return;
    const clearSlotsOnAxis = (spell && typeof spell.clearSlotsOnAxis === "object" && spell.clearSlotsOnAxis)
      ? spell.clearSlotsOnAxis
      : null;
    const slots = Array.isArray(clearSlotsOnAxis && clearSlotsOnAxis[a]) ? clearSlotsOnAxis[a] : [];
    for (const slotRaw of slots) {
      const slot = normGroup(slotRaw);
      if (!slot) continue;
      loadedByAxis[a][slot] = null;
    }
  }

  function mostRecentLoadedForGroup(group) {
    let best = null;
    for (const axis of AXES) {
      const entry = loadedByAxis[axis][group];
      if (!entry) continue;
      if (!best || Number(entry.loadedAtMs) > Number(best.loadedAtMs)) {
        best = Object.assign({ axis, slot: group }, entry);
      }
    }
    return best;
  }

  function axisAllowedForSpell(spell, axis) {
    const a = normAxis(axis);
    if (!a) return false;
    if (!spell || !Array.isArray(spell.allowedAxes) || spell.allowedAxes.length === 0) return true;
    return spell.allowedAxes.map(normAxis).includes(a);
  }

  function withRuntimeRouting(spell = {}) {
    const id = String(spell && spell.id || "").toLowerCase();
    const routing = SPELL_RUNTIME_ROUTING_BY_ID[id] || null;
    if (!routing) return spell;
    return {
      ...spell,
      ...routing,
    };
  }

  function normalizeWakeWindowTokenForRuntime(wakeWindowToken) {
    const token = String(wakeWindowToken || "").trim().toLowerCase();
    if (!token) return "";
    return String(WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN[token] || token).trim().toLowerCase();
  }

  function isWakeWindowSelectIntent(intent) {
    const value = String(intent || "").trim().toLowerCase();
    return value === "spell.wake_window_select";
  }

  function isAxisSelectIntent(intent) {
    const value = String(intent || "").trim().toLowerCase();
    return value === "spell.axis_select";
  }

  function resolveConcreteSpellForAxis(spell, axis) {
    const routed = withRuntimeRouting(spell || {});
    const intent = String(routed && routed.intent || "");
    if (!isWakeWindowSelectIntent(intent)) return routed;
    const a = normAxis(axis);
    const wakeWindowSpellRaw = String((routed && routed.wakeWindowSpell) || "").toLowerCase();
    const wakeWindowSpell = normalizeWakeWindowTokenForRuntime(wakeWindowSpellRaw);
    const axisSpell = String(selectedAxisSpellByAxis[a] || "").toLowerCase();
    if (!a || !wakeWindowSpell || !axisSpell) return null;
    const id = wakeWindowSpell;
    const base = withRuntimeRouting(ACTIVE_SPELLS_BY_ID[id] || { id });
    if (!base || !base.id) return null;
    return {
      id: String(base.id || id),
      intent: String(base.intent || ""),
      cooldownMs: Math.max(0, Number(base.cooldownMs) || 0),
      phrase: String(base.phrase || id),
      allowedAxes: Array.isArray(base.allowedAxes) ? base.allowedAxes.slice() : [a],
      fixedSlot: String(base.fixedSlot || "").toUpperCase(),
      axisSpell,
      wakeWindowSpell: String((base.wakeWindowSpell || wakeWindowSpell)).toLowerCase(),
    };
  }

  function start() {
    unsub.push(eventBus.on(EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, (payload = {}) => {
      const axis = normAxis(payload.axis);
      activeFlatSpinAxis = axis || null;
      if (axis) {
        // Flat-spin activation requires re-speaking axis token for that axis.
        selectedAxisSpellByAxis[axis] = "";
      }
    }));

    unsub.push(eventBus.on(EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED, () => {
      activeFlatSpinAxis = null;
      // Breaking flat-spin closes axis windows; user must re-speak axis token.
      selectedAxisSpellByAxis.x = "";
      selectedAxisSpellByAxis.y = "";
      selectedAxisSpellByAxis.z = "";
    }));

    unsub.push(eventBus.on(EVT_ORB_DIED, () => {
      reset();
    }));
    unsub.push(eventBus.on(EVT_ORB_REVIVED, () => {
      reset();
    }));

    unsub.push(eventBus.on(EVT_VOICE_SPELL_DETECTED, (payload = {}) => {
      const spell = withRuntimeRouting(payload.spell || {});
      const rawSpellId = String(spell.id || "");
      const spellIntent = String(spell.intent || "");
      const spellAxis = String((spell.axisSpell) || "").toLowerCase();
      const spellWakeWindow = String((spell.wakeWindowSpell) || "").toLowerCase();
      const spellId = rawSpellId;
      if (!spellId) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "invalid_spell",
          atMs: nowMs(),
        });
        return;
      }
      const now = nowMs();
      if (!ACTIVE_SPELLS_BY_ID[String(spellId || "").toLowerCase()]) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "spell_inactive",
          spellId,
          atMs: now,
        });
        return;
      }
      const axis = normAxis(activeFlatSpinAxis);
      const isFlatSpinLoadWindow = !!axis;
      const isWakeWindowSelect = isWakeWindowSelectIntent(spellIntent);
      const isAxisSelect = isAxisSelectIntent(spellIntent);

      // Strict spell-tree enforcement:
      // - axis/wake-window tokens are valid only during an active flat-spin window.
      const bypassFlatSpinGate = TEMP_UNGATED_SPELL_IDS.has(spellId);
      if (!isFlatSpinLoadWindow && !bypassFlatSpinGate && (isAxisSelect || isWakeWindowSelect)) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "spell_window_required",
          spellId,
          atMs: now,
        });
        return;
      }

      if (isFlatSpinLoadWindow) {
        if (isAxisSelect) {
          if (!axisAllowedForSpell(spell, axis)) {
            eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
              reason: "spell_axis_not_allowed",
              spellId,
              axis,
              allowedAxes: Array.isArray(spell.allowedAxes) ? spell.allowedAxes.slice() : [],
              atMs: now,
            });
            return;
          }
          selectedAxisSpellByAxis[axis] = spellAxis;
          eventBus.emit(EVT_VOICE_AXIS_SELECTED, {
            axis,
            axisSpell: spellAxis,
            spellId,
            atMs: now,
          });
          return;
        }

        // Strict tree inside flat-spin mode:
        // only wake-window-select is accepted after axis-select.
        if (!isWakeWindowSelect) {
          eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
            reason: "flat_spin_requires_wake_window_token",
            spellId,
            axis,
            atMs: now,
          });
          return;
        }

        let concreteSpell = spell;
        if (isWakeWindowSelect) {
          if (!selectedAxisSpellByAxis[axis]) {
            eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
              reason: "no_axis_selected",
              spellId,
              wakeWindowSpell: spellWakeWindow,
              axis,
              atMs: now,
            });
            return;
          }
          concreteSpell = resolveConcreteSpellForAxis(spell, axis);
          if (!concreteSpell || !concreteSpell.id) {
            eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
              reason: "axis_wake_window_resolution_failed",
              spellId,
              wakeWindowSpell: spellWakeWindow,
              axisSpell: selectedAxisSpellByAxis[axis],
              axis,
              atMs: now,
            });
            return;
          }
        }
        const concreteSpellId = String(concreteSpell && concreteSpell.id || "");
        const dedupeKey = `${axis}:${concreteSpellId}`;
        const prevLoadAt = Number(lastFlatSpinLoadAtByAxisSpell.get(dedupeKey) || 0);
        if (concreteSpellId && (now - prevLoadAt) < FLAT_SPIN_DUPLICATE_SUPPRESS_MS) {
          eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
            reason: "duplicate_spell_token",
            spellId: concreteSpellId,
            axis,
            atMs: now,
          });
          return;
        }

        const storedGlobes = getStoredGlobeCount();
        if (storedGlobes <= 0) {
          eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
            reason: "no_stored_globes",
            spellId: String(concreteSpell.id || spellId),
            axis,
            atMs: now,
          });
          return;
        }
        if (!axisAllowedForSpell(concreteSpell, axis)) {
          eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
            reason: "spell_axis_not_allowed",
            spellId: String(concreteSpell.id || spellId),
            axis,
            allowedAxes: Array.isArray(concreteSpell.allowedAxes) ? concreteSpell.allowedAxes.slice() : [],
            atMs: now,
          });
          return;
        }
        const slot = pickSlotForLoad(concreteSpell, axis);
        applyAxisSlotClearPolicy(concreteSpell, axis);
        const spendResult = consumeStoredGlobe({
          reason: "spell_load",
          spellId: String(concreteSpell.id || ""),
          axis,
          slot,
          atMs: now,
        });
        if (!spendResult || spendResult.ok !== true) {
          eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
            reason: "no_stored_globes",
            spellId: String(concreteSpell.id || spellId),
            axis,
            atMs: now,
          });
          return;
        }
        loadedByAxis[axis][slot] = {
          spellId: String(concreteSpell.id || ""),
          intent: concreteSpell.intent,
          phrase: concreteSpell.phrase,
          cooldownMs: Math.max(0, Number(concreteSpell.cooldownMs) || 0),
          confidence: Number(payload.confidence) || 0,
          loadedAtMs: now,
          axisSpell: String((concreteSpell.axisSpell) || "").toLowerCase(),
          wakeWindowSpell: String((concreteSpell.wakeWindowSpell) || "").toLowerCase(),
        };
        if (concreteSpellId) {
          lastFlatSpinLoadAtByAxisSpell.set(dedupeKey, now);
        }
        eventBus.emit(EVT_VOICE_SPELL_LOADED, {
          spellId: String(concreteSpell.id || ""),
          intent: concreteSpell.intent,
          phrase: concreteSpell.phrase,
          confidence: Number(payload.confidence) || 0,
          axis,
          slot,
          axisSpell: String((concreteSpell.axisSpell) || "").toLowerCase(),
          wakeWindowSpell: String((concreteSpell.wakeWindowSpell) || "").toLowerCase(),
          atMs: now,
        });
        return;
      }

      const castCheck = canCastSpellNow(spell, now);
      if (!castCheck.ok) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "cooldown",
          spellId,
          cooldownMs: castCheck.cooldownMs,
          remainingMs: castCheck.remainingMs,
          atMs: now,
        });
        return;
      }
      lastCastBySpellId.set(spellId, now);
      /** @type {import("../contracts/events.js").VoiceSpellCastPayload} */
      const castPayload = {
        spellId,
        intent: spell.intent,
        phrase: spell.phrase,
        confidence: Number(payload.confidence) || 0,
        trigger: "voice_immediate",
        atMs: now,
      };
      eventBus.emit(EVT_VOICE_SPELL_CAST, castPayload);
    }));

    unsub.push(eventBus.on(EVT_INPUT_SHAKE_TRIGGERED, (payload = {}) => {
      const group = normGroup(payload.group);
      if (!group) return;
      const now = nowMs();

      let loaded = null;
      const axis = normAxis(activeFlatSpinAxis);
      if (axis && loadedByAxis[axis][group]) {
        loaded = Object.assign({ axis, slot: group }, loadedByAxis[axis][group]);
      } else {
        loaded = mostRecentLoadedForGroup(group);
      }
      if (!loaded) return;

      const spell = {
        id: loaded.spellId,
        cooldownMs: Math.max(0, Number(loaded.cooldownMs) || 0),
      };
      const castCheck = canCastSpellNow(spell, now);
      if (!castCheck.ok) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "cooldown",
          spellId: loaded.spellId,
          cooldownMs: castCheck.cooldownMs,
          remainingMs: castCheck.remainingMs,
          atMs: now,
        });
        return;
      }

      loadedByAxis[loaded.axis][loaded.slot] = null;
      lastCastBySpellId.set(loaded.spellId, now);
      /** @type {import("../contracts/events.js").VoiceSpellCastPayload} */
      const castPayload = {
        spellId: loaded.spellId,
        intent: loaded.intent,
        phrase: loaded.phrase,
        confidence: Number(loaded.confidence) || 0,
        trigger: "shake_detonation",
        axis: loaded.axis,
        slot: loaded.slot,
        axisSpell: String((loaded.axisSpell) || "").toLowerCase(),
        wakeWindowSpell: String((loaded.wakeWindowSpell) || "").toLowerCase(),
        directionGroup: group,
        atMs: now,
      };
      eventBus.emit(EVT_VOICE_SPELL_CAST, castPayload);
    }));
  }

  function stop() {
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  function reset() {
    lastCastBySpellId.clear();
    lastFlatSpinLoadAtByAxisSpell.clear();
    activeFlatSpinAxis = null;
    selectedAxisSpellByAxis.x = "";
    selectedAxisSpellByAxis.y = "";
    selectedAxisSpellByAxis.z = "";
    for (const axis of AXES) {
      nextSlotIndexByAxis[axis] = 0;
      for (const slot of SLOT_ORDER) {
        loadedByAxis[axis][slot] = null;
      }
    }
  }

  return {
    start,
    stop,
    reset,
  };
}
