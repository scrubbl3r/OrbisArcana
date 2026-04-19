const FLAME_AOE_FIELDS = Object.freeze([
  ["flameDiameterRatio", "flameDiameterRatio"],
  ["flameMs", "flameMs"],
  ["flameStrokeR", "flameStrokeR"],
  ["flameStrokeG", "flameStrokeG"],
  ["flameStrokeB", "flameStrokeB"],
  ["flameStrokeA", "flameStrokeA"],
  ["flameFillR", "flameFillR"],
  ["flameFillG", "flameFillG"],
  ["flameFillB", "flameFillB"],
  ["flameFillA", "flameFillA"],
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

export function createFlameAoeAuthoringAdapter({
  flameAoePresetDefault = {},
} = {}) {
  function defaultSettings() {
    const stroke = flameAoePresetDefault.stroke || {};
    const fill = flameAoePresetDefault.fill || {};
    return {
      flameDiameterRatio: fixedNumber(clampNumber(flameAoePresetDefault.diameterRatio, 0.1, 12, 1.24), 2, 1.24),
      flameMs: roundedNumber(clampNumber(flameAoePresetDefault.durationMs, 200, 60000, 10000)),
      flameStrokeR: roundedNumber(clampNumber(stroke.r, 0, 255, 255)),
      flameStrokeG: roundedNumber(clampNumber(stroke.g, 0, 255, 96)),
      flameStrokeB: roundedNumber(clampNumber(stroke.b, 0, 255, 24)),
      flameStrokeA: fixedNumber(clampNumber(stroke.a, 0, 1, 1), 2, 1),
      flameFillR: roundedNumber(clampNumber(fill.r, 0, 255, 255)),
      flameFillG: roundedNumber(clampNumber(fill.g, 0, 255, 96)),
      flameFillB: roundedNumber(clampNumber(fill.b, 0, 255, 24)),
      flameFillA: fixedNumber(clampNumber(fill.a, 0, 1, 0.2), 2, 0.2),
    };
  }

  function capture(els) {
    return Object.fromEntries(FLAME_AOE_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    FLAME_AOE_FIELDS.forEach(([fieldKey, settingsKey]) => {
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
