const HEAL_FIELDS = Object.freeze([
  "healGlobeCost",
  "healAmountHp",
  "healCastDurationMs",
  "healCooldownMs",
  "healRequireDamagedOrb",
  "healConsumeOnFailedCast",
]);

function readNumber(field, fallback = 0) {
  const n = Number(field && field.value);
  return Number.isFinite(n) ? n : fallback;
}

function defaultSettings(defaults = {}) {
  return Object.freeze({
    healGlobeCost: Math.max(0, Math.round(Number(defaults.globeCost) || 1)),
    healAmountHp: Math.max(1, Math.round(Number(defaults.healAmountHp) || 500)),
    healCastDurationMs: Math.max(0, Math.round(Number(defaults.castDurationMs) || 250)),
    healCooldownMs: Math.max(0, Math.round(Number(defaults.cooldownMs) || 1000)),
    healRequireDamagedOrb: defaults.requireDamagedOrb !== false,
    healConsumeOnFailedCast: defaults.consumeOnFailedCast === true,
  });
}

export function createHealAuthoringAdapter({
  healPresetDefault = {},
} = {}) {
  function capture(els = {}) {
    return Object.freeze({
      healGlobeCost: Math.max(0, Math.round(readNumber(els.healGlobeCost, healPresetDefault.globeCost || 1))),
      healAmountHp: Math.max(1, Math.round(readNumber(els.healAmountHp, healPresetDefault.healAmountHp || 500))),
      healCastDurationMs: Math.max(0, Math.round(readNumber(els.healCastDurationMs, healPresetDefault.castDurationMs || 250))),
      healCooldownMs: Math.max(0, Math.round(readNumber(els.healCooldownMs, healPresetDefault.cooldownMs || 1000))),
      healRequireDamagedOrb: !!(els.healRequireDamagedOrb && els.healRequireDamagedOrb.checked),
      healConsumeOnFailedCast: !!(els.healConsumeOnFailedCast && els.healConsumeOnFailedCast.checked),
    });
  }

  function apply(els = {}, settings = {}, { applyPreview = null } = {}) {
    HEAL_FIELDS.forEach((id) => {
      const field = els[id];
      if (!field || settings[id] == null) return;
      if (field.type === "checkbox") {
        field.checked = !!settings[id];
      } else {
        field.value = String(settings[id]);
      }
    });
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings: () => defaultSettings(healPresetDefault),
    capture,
    apply,
  });
}
