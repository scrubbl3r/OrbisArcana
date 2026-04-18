const BUBBLE_SHIELD_FIELDS = Object.freeze([
  ["shieldMs", "shieldMs"],
  ["shieldAlpha", "shieldAlpha"],
  ["shieldD", "shieldD"],
  ["shieldStroke", "shieldStroke"],
  ["pulseMs", "pulseMs"],
  ["pulseMin", "pulseMin"],
  ["pulseMax", "pulseMax"],
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

export function createBubbleShieldAuthoringAdapter({
  bubbleShieldPresetDefault = {},
} = {}) {
  function defaultSettings() {
    return {
      shieldMs: roundedNumber(clampNumber(bubbleShieldPresetDefault.durationMs, 80, 120000, 8000)),
      shieldAlpha: fixedNumber(clampNumber(bubbleShieldPresetDefault.alpha, 0, 1, 1), 2, 1),
      shieldD: roundedNumber(bubbleShieldPresetDefault.diameterPx, 124),
      shieldStroke: roundedNumber(bubbleShieldPresetDefault.strokeWidthPx, 4),
      pulseMs: roundedNumber(clampNumber(bubbleShieldPresetDefault.pulseMs, 20, 700, 80)),
      pulseMin: fixedNumber(clampNumber(bubbleShieldPresetDefault.pulseMin, 0, 1, 0.3), 2, 0.3),
      pulseMax: fixedNumber(clampNumber(bubbleShieldPresetDefault.pulseMax, 0, 1, 1), 2, 1),
    };
  }

  function capture(els) {
    return Object.fromEntries(BUBBLE_SHIELD_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, {
    applyGeometry = null,
    applyShield = null,
    applyPulse = null,
  } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    BUBBLE_SHIELD_FIELDS.forEach(([fieldKey, settingsKey]) => {
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    if (typeof applyGeometry === "function") applyGeometry();
    if (typeof applyShield === "function") applyShield();
    if (typeof applyPulse === "function") applyPulse();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
