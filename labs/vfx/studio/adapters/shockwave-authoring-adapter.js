const SHOCKWAVE_FIELDS = Object.freeze([
  ["startR", "startR"],
  ["endR", "endR"],
  ["rings", "rings"],
  ["spawn", "spawn"],
  ["stroke", "stroke"],
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
    return {
      startR: roundedNumber(clampNumber(shockwavePresetDefault.startR, 1, 1000, 43)),
      endR: roundedNumber(clampNumber(shockwavePresetDefault.endR, 1, 1000, 169)),
      rings: roundedNumber(clampNumber(shockwavePresetDefault.rings, 1, 6, 2)),
      spawn: roundedNumber(clampNumber(shockwavePresetDefault.spawnMs, 1, 700, 105)),
      stroke: roundedNumber(clampNumber(shockwavePresetDefault.stroke, 1, 40, 4)),
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
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
