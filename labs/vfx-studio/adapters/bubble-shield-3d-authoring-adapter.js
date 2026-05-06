const BUBBLE_SHIELD_3D_FIELDS = Object.freeze([
  ["shield3dMs", "durationMs"],
  ["shield3dDiameterRatio", "diameterRatio"],
  ["shield3dEndDiameterRatio", "endDiameterRatio"],
  ["shield3dTransitionMs", "transitionMs"],
  ["shield3dOvershoot", "overshoot"],
  ["shield3dJiggleFrequency", "jiggleFrequency"],
  ["shield3dJiggleDecay", "jiggleDecay"],
  ["shield3dAlpha", "alpha"],
  ["shield3dPulseMs", "pulseMs"],
  ["shield3dPulseMin", "pulseMin"],
  ["shield3dPulseMax", "pulseMax"],
  ["shield3dSimplexScale", "simplexScale"],
  ["shield3dSimplexSpeed", "simplexSpeed"],
  ["shield3dSimplexDensityBottom", "simplexDensityBottom"],
  ["shield3dSimplexDensityTop", "simplexDensityTop"],
  ["shield3dSimplexContrast", "simplexContrast"],
  ["shield3dSimplexOctaves", "simplexOctaves"],
  ["shield3dSimplexLacunarity", "simplexLacunarity"],
  ["shield3dSimplexGain", "simplexGain"],
]);

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function fixedNumber(value, digits, fallback = 0) {
  return Number(clampNumber(value, -Infinity, Infinity, fallback).toFixed(digits));
}

function roundedNumber(value, fallback = 0) {
  return Math.round(clampNumber(value, -Infinity, Infinity, fallback));
}

export function createBubbleShield3dAuthoringAdapter({
  bubbleShield3dPresetDefault = {},
} = {}) {
  function defaultSettings() {
    return {
      durationMs: roundedNumber(clampNumber(bubbleShield3dPresetDefault.durationMs, 80, 120000, 5000)),
      diameterRatio: fixedNumber(clampNumber(bubbleShield3dPresetDefault.startDiameterRatio ?? bubbleShield3dPresetDefault.diameterRatio, 0.1, 8, 1.24), 2, 1.24),
      endDiameterRatio: fixedNumber(clampNumber(bubbleShield3dPresetDefault.endDiameterRatio, 0.1, 8, 1.8), 2, 1.8),
      transitionMs: roundedNumber(clampNumber(bubbleShield3dPresetDefault.transitionMs, 0, 3000, 420)),
      overshoot: fixedNumber(clampNumber(bubbleShield3dPresetDefault.overshoot ?? bubbleShield3dPresetDefault.bounceAmount, 0, 1.5, 0.12), 2, 0.12),
      jiggleFrequency: fixedNumber(clampNumber(bubbleShield3dPresetDefault.jiggleFrequency, 0, 48, 18), 2, 18),
      jiggleDecay: fixedNumber(clampNumber(bubbleShield3dPresetDefault.jiggleDecay, 0, 24, 7), 2, 7),
      alpha: fixedNumber(clampNumber(bubbleShield3dPresetDefault.alpha, 0, 1, 1), 2, 1),
      pulseMs: roundedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMs, 20, 700, 80)),
      pulseMin: fixedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMin, 0, 1, 0.3), 2, 0.3),
      pulseMax: fixedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMax, 0, 1, 1), 2, 1),
      simplexScale: fixedNumber(clampNumber(bubbleShield3dPresetDefault.simplexScale, 0.1, 16, 0.85), 2, 0.85),
      simplexSpeed: fixedNumber(clampNumber(bubbleShield3dPresetDefault.simplexSpeed, 0, 24, 6), 2, 6),
      simplexDensityBottom: fixedNumber(clampNumber(bubbleShield3dPresetDefault.simplexDensityBottom, 0, 1, 0), 2, 0),
      simplexDensityTop: fixedNumber(clampNumber(bubbleShield3dPresetDefault.simplexDensityTop, 0, 1, 0.3), 2, 0.3),
      simplexContrast: fixedNumber(clampNumber(bubbleShield3dPresetDefault.simplexContrast, 0.02, 1, 0.6), 2, 0.6),
      simplexOctaves: roundedNumber(clampNumber(bubbleShield3dPresetDefault.simplexOctaves, 1, 8, 3)),
      simplexLacunarity: fixedNumber(clampNumber(bubbleShield3dPresetDefault.simplexLacunarity, 1, 4, 1.1), 2, 1.1),
      simplexGain: fixedNumber(clampNumber(bubbleShield3dPresetDefault.simplexGain, 0.05, 0.95, 0.3), 2, 0.3),
    };
  }

  function capture(els) {
    const out = Object.fromEntries(BUBBLE_SHIELD_3D_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
    return out;
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    BUBBLE_SHIELD_3D_FIELDS.forEach(([fieldKey, settingsKey]) => {
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
