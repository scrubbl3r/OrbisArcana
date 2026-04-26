const ORB_BASE_FIELDS = Object.freeze([
  ["orbBaseD", "orbBaseD"],
  ["orbBaseStroke", "orbBaseStroke"],
  ["orbBaseStrokeAlpha", "orbBaseStrokeAlpha"],
  ["orbBaseFillAlpha", "orbBaseFillAlpha"],
  ["orbBaseStrokeR", "orbBaseStrokeR"],
  ["orbBaseStrokeG", "orbBaseStrokeG"],
  ["orbBaseStrokeB", "orbBaseStrokeB"],
  ["orbBaseFillR", "orbBaseFillR"],
  ["orbBaseFillG", "orbBaseFillG"],
  ["orbBaseFillB", "orbBaseFillB"],
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

function rgbPart(rgb, key) {
  return roundedNumber(rgb && rgb[key], key === "r" ? 255 : 255);
}

export function createOrbBaseAuthoringAdapter({
  orbBaseVisualDefaults = {},
} = {}) {
  function defaultSettings() {
    const stroke = orbBaseVisualDefaults.strokeDefaultRgb || {};
    const fill = orbBaseVisualDefaults.fillDefaultRgb || {};
    return {
      orbBaseD: roundedNumber(orbBaseVisualDefaults.diameterPx),
      orbBaseStroke: roundedNumber(orbBaseVisualDefaults.strokeWidthPx),
      orbBaseStrokeAlpha: fixedNumber(orbBaseVisualDefaults.strokeAlpha, 2, 1),
      orbBaseFillAlpha: fixedNumber(orbBaseVisualDefaults.fillAlpha, 2, 0.2),
      orbBaseStrokeR: rgbPart(stroke, "r"),
      orbBaseStrokeG: rgbPart(stroke, "g"),
      orbBaseStrokeB: rgbPart(stroke, "b"),
      orbBaseFillR: rgbPart(fill, "r"),
      orbBaseFillG: rgbPart(fill, "g"),
      orbBaseFillB: rgbPart(fill, "b"),
    };
  }

  function capture(els) {
    return Object.fromEntries(ORB_BASE_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ORB_BASE_FIELDS.forEach(([fieldKey, settingsKey]) => {
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
