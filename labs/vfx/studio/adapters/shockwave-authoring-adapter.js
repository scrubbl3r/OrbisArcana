const SHOCKWAVE_FIELDS = Object.freeze([
  ["shockStartRatio", "shockStartRatio"],
  ["shockEndRatio", "shockEndRatio"],
  ["rings", "rings"],
  ["spawn", "spawn"],
  ["shockStrokeRatio", "shockStrokeRatio"],
  ["decay", "decay"],
  ["shockR", "shockR"],
  ["shockG", "shockG"],
  ["shockB", "shockB"],
  ["shockA", "shockA"],
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

export function createShockwaveAuthoringAdapter({
  shockwavePresetDefault = {},
} = {}) {
  function defaultSettings() {
    const color = shockwavePresetDefault.color || {};
    const startRatio = Number.isFinite(Number(shockwavePresetDefault.startRatio))
      ? Number(shockwavePresetDefault.startRatio)
      : (Number(shockwavePresetDefault.startR) || 43) / 100;
    const endRatio = Number.isFinite(Number(shockwavePresetDefault.endRatio))
      ? Number(shockwavePresetDefault.endRatio)
      : (Number(shockwavePresetDefault.endR) || 169) / 100;
    const strokeRatio = Number.isFinite(Number(shockwavePresetDefault.strokeRatio))
      ? Number(shockwavePresetDefault.strokeRatio)
      : (Number(shockwavePresetDefault.stroke) || 4) / 100;
    return {
      shockStartRatio: fixedNumber(clampNumber(startRatio, 0.01, 10, 0.43), 2, 0.43),
      shockEndRatio: fixedNumber(clampNumber(endRatio, 0.01, 20, 1.69), 2, 1.69),
      rings: roundedNumber(clampNumber(shockwavePresetDefault.rings, 1, 6, 2)),
      spawn: roundedNumber(clampNumber(shockwavePresetDefault.spawnMs, 1, 700, 105)),
      shockStrokeRatio: fixedNumber(clampNumber(strokeRatio, 0.005, 1, 0.04), 3, 0.04),
      decay: roundedNumber(clampNumber(shockwavePresetDefault.decayMs, 40, 2000, 150)),
      shockR: roundedNumber(clampNumber(color.r, 0, 255, 255)),
      shockG: roundedNumber(clampNumber(color.g, 0, 255, 255)),
      shockB: roundedNumber(clampNumber(color.b, 0, 255, 255)),
      shockA: fixedNumber(clampNumber(color.a, 0, 1, 0.65), 2, 0.65),
    };
  }

  function capture(els) {
    return Object.fromEntries(SHOCKWAVE_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    SHOCKWAVE_FIELDS.forEach(([fieldKey, settingsKey]) => {
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    if (els.shockStartRatio && settings.startR != null && settings.shockStartRatio == null) {
      els.shockStartRatio.value = String(((Number(settings.startR) || 43) / 100).toFixed(2));
    }
    if (els.shockEndRatio && settings.endR != null && settings.shockEndRatio == null) {
      els.shockEndRatio.value = String(((Number(settings.endR) || 169) / 100).toFixed(2));
    }
    if (els.shockStrokeRatio && settings.stroke != null && settings.shockStrokeRatio == null) {
      els.shockStrokeRatio.value = String(((Number(settings.stroke) || 4) / 100).toFixed(3));
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
