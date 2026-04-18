const ORB_NOD_FIELDS = Object.freeze([
  ["orbNodShrinkPct", "orbTemplateShrinkPct"],
  ["orbNodDurationMs", "orbTemplateDurationMs"],
  ["orbNodFillAlpha", "orbTemplateFillAlpha"],
  ["orbNodWaveCount", "orbTemplateWaveCount"],
  ["orbNodWaveDepthPx", "orbTemplateWaveDepthPx"],
  ["orbNodOscillationSpeedHz", "orbTemplateOscillationSpeedHz"],
  ["orbNodOscillationCount", "orbTemplateOscillationCount"],
]);

function fixedNumber(value, digits, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Number((Number.isFinite(n) ? n : f).toFixed(digits));
}

function roundedNumber(value, fallback = 0) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return Math.round(Number.isFinite(n) ? n : f);
}

export function createOrbNodAuthoringAdapter({
  orbNodPresetDefault = {},
  getOrbBaseVisualState = null,
} = {}) {
  function defaultSettings() {
    return {
      orbTemplateShrinkPct: roundedNumber(orbNodPresetDefault.orbTemplateShrinkPct, 6),
      orbTemplateDurationMs: roundedNumber(orbNodPresetDefault.orbTemplateDurationMs, 200),
      orbTemplateFillAlpha: fixedNumber(orbNodPresetDefault.orbTemplateFillAlpha, 2, 0.07),
      orbTemplateWaveCount: roundedNumber(orbNodPresetDefault.orbTemplateWaveCount, 10),
      orbTemplateWaveDepthPx: Number(orbNodPresetDefault.orbTemplateWaveDepthPx) || 10,
      orbTemplateOscillationSpeedHz: Number(orbNodPresetDefault.orbTemplateOscillationSpeedHz) || 12,
      orbTemplateOscillationCount: roundedNumber(orbNodPresetDefault.orbTemplateOscillationCount, 2),
    };
  }

  function capture(els) {
    return Object.fromEntries(ORB_NOD_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function legacyBoostedFillAlpha(settings) {
    const hasOpacityBoost = settings.orbTemplateFillOpacityBoost != null;
    const hasBrightnessBoost = settings.orbTemplateBrightnessBoost != null;
    if (!hasOpacityBoost && !hasBrightnessBoost) return null;
    const baseState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    const baseFillAlpha = Number(baseState && baseState.fillAlpha) || 0.20;
    const boostValue = hasOpacityBoost
      ? settings.orbTemplateFillOpacityBoost
      : settings.orbTemplateBrightnessBoost;
    const boost01 = Math.max(0, Math.min(1, Number(boostValue) / 100));
    return (baseFillAlpha + ((1 - baseFillAlpha) * boost01)).toFixed(2);
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ORB_NOD_FIELDS.forEach(([fieldKey, settingsKey]) => {
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    if (els.orbNodFillAlpha && settings.orbTemplateFillAlpha == null) {
      const legacyFillAlpha = legacyBoostedFillAlpha(settings);
      if (legacyFillAlpha != null) els.orbNodFillAlpha.value = legacyFillAlpha;
    }
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
