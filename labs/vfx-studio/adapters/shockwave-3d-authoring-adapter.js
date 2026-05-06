const SHOCKWAVE_3D_FIELDS = Object.freeze([
  ["shockwave3dSphereCount", "sphereCount"],
  ["shockwave3dSpawnMs", "spawnMs"],
  ["shockwave3dExpandMs", "expandMs"],
  ["shockwave3dDecayMs", "decayMs"],
  ["shockwave3dStartRatio", "startRatio"],
  ["shockwave3dEndRatio", "endRatio"],
  ["shockwave3dIcoDetail", "icoDetail"],
  ["shockwave3dFresnelPower", "fresnelPower"],
  ["shockwave3dCenterAlpha", "centerAlpha"],
  ["shockwave3dRimAlpha", "rimAlpha"],
  ["shockwave3dLuminanceBoost", "luminanceBoost"],
  ["shockwave3dR", "colorR"],
  ["shockwave3dG", "colorG"],
  ["shockwave3dB", "colorB"],
  ["shockwave3dA", "colorA"],
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

export function createShockwave3dAuthoringAdapter({
  shockwavePresetDefault = {},
} = {}) {
  function defaultSettings() {
    const color = shockwavePresetDefault.color || {};
    return {
      sphereCount: roundedNumber(clampNumber(shockwavePresetDefault.rings, 1, 8, 2)),
      spawnMs: roundedNumber(clampNumber(shockwavePresetDefault.spawnMs, 1, 1000, 105)),
      expandMs: roundedNumber(clampNumber(shockwavePresetDefault.decayMs, 40, 4000, 150)),
      decayMs: roundedNumber(clampNumber(shockwavePresetDefault.decayMs, 40, 4000, 150)),
      startRatio: fixedNumber(clampNumber(shockwavePresetDefault.startRatio, 0.01, 10, 0.43), 2, 0.43),
      endRatio: fixedNumber(clampNumber(shockwavePresetDefault.endRatio, 0.01, 20, 1.69), 2, 1.69),
      icoDetail: 3,
      fresnelPower: 2.6,
      centerAlpha: 0.01,
      rimAlpha: 0.62,
      luminanceBoost: 1.45,
      colorR: roundedNumber(clampNumber(color.r, 0, 255, 255)),
      colorG: roundedNumber(clampNumber(color.g, 0, 255, 255)),
      colorB: roundedNumber(clampNumber(color.b, 0, 255, 255)),
      colorA: fixedNumber(clampNumber(color.a, 0, 1, 0.65), 2, 0.65),
    };
  }

  function capture(els) {
    return Object.fromEntries(SHOCKWAVE_3D_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    SHOCKWAVE_3D_FIELDS.forEach(([fieldKey, settingsKey]) => {
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
