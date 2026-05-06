const BUBBLE_SHIELD_3D_FIELDS = Object.freeze([
  ["shield3dMs", "durationMs"],
  ["shield3dDiameterRatio", "diameterRatio"],
  ["shield3dAlpha", "alpha"],
  ["shield3dPulseMs", "pulseMs"],
  ["shield3dPulseMin", "pulseMin"],
  ["shield3dPulseMax", "pulseMax"],
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
      diameterRatio: fixedNumber(clampNumber(bubbleShield3dPresetDefault.diameterRatio, 0.1, 8, 1.24), 2, 1.24),
      alpha: fixedNumber(clampNumber(bubbleShield3dPresetDefault.alpha, 0, 1, 1), 2, 1),
      pulseMs: roundedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMs, 20, 700, 80)),
      pulseMin: fixedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMin, 0, 1, 0.3), 2, 0.3),
      pulseMax: fixedNumber(clampNumber(bubbleShield3dPresetDefault.pulseMax, 0, 1, 1), 2, 1),
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
