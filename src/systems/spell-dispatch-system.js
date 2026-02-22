import { SPELLS_BY_ID } from "../voice/spellbook.js";

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
  const loadedByAxis = {
    x: { UD: null, LR: null, FB: null },
    y: { UD: null, LR: null, FB: null },
    z: { UD: null, LR: null, FB: null },
  };
  const nextSlotIndexByAxis = { x: 0, y: 0, z: 0 };
  let activeFlatSpinAxis = null;
  const selectedSchoolByAxis = { x: "", y: "", z: "" };

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
    const classKey = String(spell && spell.classKey || "").toLowerCase();
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
    unsub.push(eventBus.on("spell_window.flat_spin_opened", (payload = {}) => {
      const axis = normAxis(payload.axis);
      activeFlatSpinAxis = axis || null;
    }));

    unsub.push(eventBus.on("spell_window.flat_spin_closed", () => {
      activeFlatSpinAxis = null;
    }));

    unsub.push(eventBus.on("orb.died", () => {
      reset();
    }));
    unsub.push(eventBus.on("orb.revived", () => {
      reset();
    }));

    unsub.push(eventBus.on("voice.spell_detected", (payload = {}) => {
      const spell = payload.spell || {};
      const rawSpellId = String(spell.id || "");
      const spellIntent = String(spell.intent || "");
      const spellSchool = String(spell.school || "").toLowerCase();
      const spellClass = String(spell.classKey || "").toLowerCase();
      const spellId = rawSpellId;
      if (!spellId) {
        eventBus.emit("voice.spell_rejected", {
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
            eventBus.emit("voice.spell_rejected", {
              reason: "spell_axis_not_allowed",
              spellId,
              axis,
              allowedAxes: Array.isArray(spell.allowedAxes) ? spell.allowedAxes.slice() : [],
              atMs: now,
            });
            return;
          }
          selectedSchoolByAxis[axis] = spellSchool;
          eventBus.emit("voice.school_selected", {
            axis,
            school: spellSchool,
            spellId,
            atMs: now,
          });
          return;
        }

        let concreteSpell = spell;
        if (spellIntent === "spell.class_select") {
          if (!selectedSchoolByAxis[axis]) {
            eventBus.emit("voice.spell_rejected", {
              reason: "no_school_selected",
              spellId,
              classKey: spellClass,
              axis,
              atMs: now,
            });
            return;
          }
          concreteSpell = resolveConcreteSpellForAxis(spell, axis);
          if (!concreteSpell || !concreteSpell.id) {
            eventBus.emit("voice.spell_rejected", {
              reason: "school_class_resolution_failed",
              spellId,
              classKey: spellClass,
              school: selectedSchoolByAxis[axis],
              axis,
              atMs: now,
            });
            return;
          }
        } else if (spellSchool) {
          selectedSchoolByAxis[axis] = spellSchool;
        }

        const storedGlobes = getStoredGlobeCount();
        if (storedGlobes <= 0) {
          eventBus.emit("voice.spell_rejected", {
            reason: "no_stored_globes",
            spellId: String(concreteSpell.id || spellId),
            axis,
            atMs: now,
          });
          return;
        }
        if (!axisAllowedForSpell(concreteSpell, axis)) {
          eventBus.emit("voice.spell_rejected", {
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
          eventBus.emit("voice.spell_rejected", {
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
        eventBus.emit("voice.spell_loaded", {
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
        eventBus.emit("voice.spell_rejected", {
          reason: "cooldown",
          spellId,
          cooldownMs: castCheck.cooldownMs,
          remainingMs: castCheck.remainingMs,
          atMs: now,
        });
        return;
      }
      lastCastBySpellId.set(spellId, now);
      eventBus.emit("voice.spell_cast", {
        spellId,
        intent: spell.intent,
        phrase: spell.phrase,
        confidence: Number(payload.confidence) || 0,
        trigger: "voice_immediate",
        atMs: now,
      });
    }));

    unsub.push(eventBus.on("input.shake_triggered", (payload = {}) => {
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
        eventBus.emit("voice.spell_rejected", {
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
      eventBus.emit("voice.spell_cast", {
        spellId: loaded.spellId,
        intent: loaded.intent,
        phrase: loaded.phrase,
        confidence: Number(loaded.confidence) || 0,
        trigger: "shake_detonation",
        axis: loaded.axis,
        slot: loaded.slot,
        directionGroup: group,
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
    lastCastBySpellId.clear();
    activeFlatSpinAxis = null;
    selectedSchoolByAxis.x = "";
    selectedSchoolByAxis.y = "";
    selectedSchoolByAxis.z = "";
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
