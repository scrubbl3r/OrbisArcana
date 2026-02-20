export function createSpellDispatchSystem({ eventBus, nowMs = () => Date.now() }) {
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

  function start() {
    unsub.push(eventBus.on("spell_window.flat_spin_opened", (payload = {}) => {
      const axis = normAxis(payload.axis);
      activeFlatSpinAxis = axis || null;
    }));

    unsub.push(eventBus.on("spell_window.flat_spin_closed", () => {
      activeFlatSpinAxis = null;
    }));

    unsub.push(eventBus.on("voice.spell_detected", (payload = {}) => {
      const spell = payload.spell || {};
      const spellId = String(spell.id || "");
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
        const slot = pickSlotForLoad(spell, axis);
        if (spellId === "domus" && axis === "y") {
          // Keep Y-axis LR/FB empty for DOMUS.
          loadedByAxis.y.LR = null;
          loadedByAxis.y.FB = null;
        }
        loadedByAxis[axis][slot] = {
          spellId,
          intent: spell.intent,
          phrase: spell.phrase,
          cooldownMs: Math.max(0, Number(spell.cooldownMs) || 0),
          confidence: Number(payload.confidence) || 0,
          loadedAtMs: now,
        };
        eventBus.emit("voice.spell_loaded", {
          spellId,
          intent: spell.intent,
          phrase: spell.phrase,
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
