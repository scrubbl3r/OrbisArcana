export function createSpellDispatchSystem({ eventBus, nowMs = () => Date.now() }) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createSpellDispatchSystem requires eventBus.on/eventBus.emit");
  }

  const unsub = [];
  const lastCastBySpellId = new Map();

  function start() {
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

      const cooldownMs = Math.max(0, Number(spell.cooldownMs) || 0);
      const now = nowMs();
      const last = Number(lastCastBySpellId.get(spellId) || 0);
      const elapsed = now - last;

      if (cooldownMs > 0 && elapsed < cooldownMs) {
        eventBus.emit("voice.spell_rejected", {
          reason: "cooldown",
          spellId,
          cooldownMs,
          remainingMs: Math.max(0, cooldownMs - elapsed),
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
  }

  return {
    start,
    stop,
    reset,
  };
}
