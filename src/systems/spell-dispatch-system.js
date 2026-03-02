import { SPELLS_BY_ID } from "../voice/spellbook.js";
import { normalizeSpellClassTokenForRuntime } from "../voice/spell-decision-tree.js";
import {
  EVT_SPELL_WINDOW_FLAT_SPIN_OPENED,
  EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED,
  EVT_ORB_DIED,
  EVT_ORB_REVIVED,
  EVT_VOICE_SPELL_DETECTED,
  EVT_VOICE_SPELL_REJECTED,
  EVT_VOICE_SCHOOL_SELECTED,
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
  const CLASS_SELECT_ARM_DELAY_MS = 220;
  const loadedByAxis = {
    x: { UD: null, LR: null, FB: null },
    y: { UD: null, LR: null, FB: null },
    z: { UD: null, LR: null, FB: null },
  };
  const lastFlatSpinLoadAtByAxisSpell = new Map();
  const nextSlotIndexByAxis = { x: 0, y: 0, z: 0 };
  let activeFlatSpinAxis = null;
  const selectedSchoolByAxis = { x: "", y: "", z: "" };
  const selectedSchoolAtByAxis = { x: 0, y: 0, z: 0 };

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
    const spellId = String(spell && spell.id || "");
    const a = normAxis(axis);
    const fixed = normGroup(spell && spell.fixedSlot);
    if (fixed) return fixed;
    // Design rule: DOMUS on Y flat spin always locks to UD.
    if (spellId === "domus" && a === "y") return "UD";
    return reserveNextSlotForAxis(a);
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

  function resolveConcreteSpellForAxis(spell, axis) {
    const intent = String(spell && spell.intent || "");
    if (intent !== "spell.class_select") return spell;
    const a = normAxis(axis);
    const classKeyRaw = String(spell && spell.classKey || "").toLowerCase();
    const classKey = normalizeSpellClassTokenForRuntime(classKeyRaw);
    const school = String(selectedSchoolByAxis[a] || "").toLowerCase();
    if (!a || !classKey || !school) return null;
    const id = `${school}_${classKey}`;
    const base = SPELLS_BY_ID[id];
    if (!base) return null;
    return {
      id: String(base.id || id),
      intent: String(base.intent || ""),
      cooldownMs: Math.max(0, Number(base.cooldownMs) || 0),
      phrase: String(base.phrase || id),
      allowedAxes: Array.isArray(base.allowedAxes) ? base.allowedAxes.slice() : [a],
      fixedSlot: String(base.fixedSlot || "").toUpperCase(),
      school: String(base.school || school).toLowerCase(),
      classKey: String(base.classKey || classKey).toLowerCase(),
    };
  }

  function start() {
    unsub.push(eventBus.on(EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, (payload = {}) => {
      const axis = normAxis(payload.axis);
      activeFlatSpinAxis = axis || null;
      if (axis) {
        // New flat-spin activation requires re-speaking school wake for that axis.
        selectedSchoolByAxis[axis] = "";
        selectedSchoolAtByAxis[axis] = 0;
      }
    }));

    unsub.push(eventBus.on(EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED, () => {
      activeFlatSpinAxis = null;
      // Breaking flat-spin closes school window(s); user must re-speak school token.
      selectedSchoolByAxis.x = "";
      selectedSchoolByAxis.y = "";
      selectedSchoolByAxis.z = "";
      selectedSchoolAtByAxis.x = 0;
      selectedSchoolAtByAxis.y = 0;
      selectedSchoolAtByAxis.z = 0;
    }));

    unsub.push(eventBus.on(EVT_ORB_DIED, () => {
      reset();
    }));
    unsub.push(eventBus.on(EVT_ORB_REVIVED, () => {
      reset();
    }));

    unsub.push(eventBus.on(EVT_VOICE_SPELL_DETECTED, (payload = {}) => {
      const spell = payload.spell || {};
      const rawSpellId = String(spell.id || "");
      const spellIntent = String(spell.intent || "");
      const spellSchool = String(spell.school || "").toLowerCase();
      const spellClass = String(spell.classKey || "").toLowerCase();
      const spellId = rawSpellId;
      if (!spellId) {
        eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
          reason: "invalid_spell",
          atMs: nowMs(),
        });
        return;
      }

      const now = nowMs();
      const axis = normAxis(activeFlatSpinAxis);
      const isFlatSpinLoadWindow = !!axis;

      if (isFlatSpinLoadWindow) {
        if (spellIntent === "spell.school_select") {
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
          selectedSchoolByAxis[axis] = spellSchool;
          selectedSchoolAtByAxis[axis] = now;
          eventBus.emit(EVT_VOICE_SCHOOL_SELECTED, {
            axis,
            school: spellSchool,
            spellId,
            atMs: now,
          });
          return;
        }

        const isClassSelect = spellIntent === "spell.class_select";
        const isDirectSchoolClass =
          spellIntent === "spell.school_shield"
          || spellIntent === "spell.school_ray"
          || spellIntent === "spell.school_aoe";

        // In flat-spin mode, accept either:
        // 1) school -> class progression, or
        // 2) direct school+class spell tokens (e.g., "electrum sanctum").
        if (!isClassSelect && !isDirectSchoolClass) {
          eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
            reason: "flat_spin_requires_school_or_class",
            spellId,
            axis,
            atMs: now,
          });
          return;
        }

        let concreteSpell = spell;
        if (isClassSelect) {
          if (!selectedSchoolByAxis[axis]) {
            eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
              reason: "no_school_selected",
              spellId,
              classKey: spellClass,
              axis,
              atMs: now,
            });
            return;
          }
          const selectedAt = Number(selectedSchoolAtByAxis[axis] || 0);
          if (selectedAt > 0 && (now - selectedAt) < CLASS_SELECT_ARM_DELAY_MS) {
            eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
              reason: "school_settle",
              spellId,
              classKey: spellClass,
              axis,
              atMs: now,
            });
            return;
          }
          concreteSpell = resolveConcreteSpellForAxis(spell, axis);
          if (!concreteSpell || !concreteSpell.id) {
            eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
              reason: "school_class_resolution_failed",
              spellId,
              classKey: spellClass,
              school: selectedSchoolByAxis[axis],
              axis,
              atMs: now,
            });
            return;
          }
        } else if (isDirectSchoolClass) {
          const axisSchool = axis === "x" ? "fridgis" : axis === "y" ? "ignis" : axis === "z" ? "electrum" : "";
          const tokenSchool = String(concreteSpell.school || "").toLowerCase();
          if (axisSchool && tokenSchool && tokenSchool !== axisSchool) {
            eventBus.emit(EVT_VOICE_SPELL_REJECTED, {
              reason: "spell_school_not_allowed_for_axis",
              spellId: String(concreteSpell.id || spellId),
              axis,
              school: tokenSchool,
              requiredSchool: axisSchool,
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
        if (String(concreteSpell.id || "") === "domus" && axis === "y") {
          // Keep Y-axis LR/FB empty for DOMUS.
          loadedByAxis.y.LR = null;
          loadedByAxis.y.FB = null;
        }
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
    selectedSchoolByAxis.x = "";
    selectedSchoolByAxis.y = "";
    selectedSchoolByAxis.z = "";
    selectedSchoolAtByAxis.x = 0;
    selectedSchoolAtByAxis.y = 0;
    selectedSchoolAtByAxis.z = 0;
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
