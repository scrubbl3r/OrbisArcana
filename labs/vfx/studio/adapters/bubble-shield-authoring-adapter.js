const BUBBLE_SHIELD_FIELDS = Object.freeze([
  ["shieldMs", "shieldMs"],
  ["shieldAlpha", "shieldAlpha"],
  ["shieldDiameterRatio", "shieldDiameterRatio"],
  ["shieldStrokeRatio", "shieldStrokeRatio"],
  ["shieldR", "shieldR"],
  ["shieldG", "shieldG"],
  ["shieldB", "shieldB"],
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
    const colorRgb = bubbleShieldPresetDefault.colorRgb || {};
    const diameterRatio = Number.isFinite(Number(bubbleShieldPresetDefault.diameterRatio))
      ? Number(bubbleShieldPresetDefault.diameterRatio)
      : (Number(bubbleShieldPresetDefault.diameterPx) || 124) / 100;
    const strokeWidthRatio = Number.isFinite(Number(bubbleShieldPresetDefault.strokeWidthRatio))
      ? Number(bubbleShieldPresetDefault.strokeWidthRatio)
      : (Number(bubbleShieldPresetDefault.strokeWidthPx) || 4) / 100;
    return {
      shieldMs: roundedNumber(clampNumber(bubbleShieldPresetDefault.durationMs, 80, 120000, 8000)),
      shieldAlpha: fixedNumber(clampNumber(bubbleShieldPresetDefault.alpha, 0, 1, 1), 2, 1),
      shieldDiameterRatio: fixedNumber(clampNumber(diameterRatio, 0.1, 8, 1.24), 2, 1.24),
      shieldStrokeRatio: fixedNumber(clampNumber(strokeWidthRatio, 0.005, 1, 0.04), 3, 0.04),
      shieldR: roundedNumber(clampNumber(colorRgb.r, 0, 255, 120)),
      shieldG: roundedNumber(clampNumber(colorRgb.g, 0, 255, 210)),
      shieldB: roundedNumber(clampNumber(colorRgb.b, 0, 255, 255)),
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
    if (els.shieldDiameterRatio && settings.shieldD != null && settings.shieldDiameterRatio == null) {
      els.shieldDiameterRatio.value = String((Number(settings.shieldD) || 124) / 100);
    }
    if (els.shieldStrokeRatio && settings.shieldStroke != null && settings.shieldStrokeRatio == null) {
      els.shieldStrokeRatio.value = String(((Number(settings.shieldStroke) || 4) / 100).toFixed(3));
    }
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
