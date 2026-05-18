const HEAL_FIELDS = Object.freeze([
  "healGlobeCost",
  "healAmountHp",
  "healCastDurationMs",
  "healCooldownMs",
  "healRequireDamagedOrb",
  "healConsumeOnFailedCast",
  "healShaderLuminanceBoostPct",
  "healShaderCenterAlphaPct",
  "healShaderPointLightIntensityPct",
  "healShaderPointLightDistancePct",
  "healShaderGoldMixPct",
  "healShaderPulseDurationMs",
  "healShaderPulseEasing",
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
    healShaderLuminanceBoostPct: Math.max(0, Math.round(Number(defaults.shaderPulseLuminanceBoostPct) || 25)),
    healShaderCenterAlphaPct: Math.max(0, Math.round(Number(defaults.shaderPulseCenterAlphaPct) || 10)),
    healShaderPointLightIntensityPct: Math.max(0, Math.round(Number(defaults.shaderPulsePointLightIntensityPct ?? defaults.shaderPulseSpotIntensityPct) || 25)),
    healShaderPointLightDistancePct: Math.max(0, Math.round(Number(defaults.shaderPulsePointLightDistancePct ?? defaults.shaderPulseSpotDistancePct) || 10)),
    healShaderGoldMixPct: Math.max(0, Math.round(Number(defaults.shaderPulseGoldMixPct) || 25)),
    healShaderPulseDurationMs: Math.max(80, Math.round(Number(defaults.shaderPulseDurationMs) || 150)),
    healShaderPulseEasing: String(defaults.shaderPulseEasing || "easeInOutQuad"),
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
      healShaderLuminanceBoostPct: Math.max(0, Math.round(readNumber(els.healShaderLuminanceBoostPct, healPresetDefault.shaderPulseLuminanceBoostPct || 25))),
      healShaderCenterAlphaPct: Math.max(0, Math.round(readNumber(els.healShaderCenterAlphaPct, healPresetDefault.shaderPulseCenterAlphaPct || 10))),
      healShaderPointLightIntensityPct: Math.max(0, Math.round(readNumber(els.healShaderPointLightIntensityPct, healPresetDefault.shaderPulsePointLightIntensityPct ?? healPresetDefault.shaderPulseSpotIntensityPct ?? 25))),
      healShaderPointLightDistancePct: Math.max(0, Math.round(readNumber(els.healShaderPointLightDistancePct, healPresetDefault.shaderPulsePointLightDistancePct ?? healPresetDefault.shaderPulseSpotDistancePct ?? 10))),
      healShaderGoldMixPct: Math.max(0, Math.round(readNumber(els.healShaderGoldMixPct, healPresetDefault.shaderPulseGoldMixPct || 25))),
      healShaderPulseDurationMs: Math.max(80, Math.round(readNumber(els.healShaderPulseDurationMs, healPresetDefault.shaderPulseDurationMs || 150))),
      healShaderPulseEasing: String(els.healShaderPulseEasing && els.healShaderPulseEasing.value || healPresetDefault.shaderPulseEasing || "easeInOutQuad"),
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
    [
      ["healShaderPointLightIntensityPct", "healShaderSpotIntensityPct"],
      ["healShaderPointLightDistancePct", "healShaderSpotDistancePct"],
    ].forEach(([nextId, legacyId]) => {
      const field = els[nextId];
      if (!field || settings[nextId] != null || settings[legacyId] == null) return;
      field.value = String(settings[legacyId]);
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
