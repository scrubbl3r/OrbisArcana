const ORB_NOD_3D_FIELDS = Object.freeze([
  ["orbNod3dShrinkPct", "orbNod3dShrinkPct"],
  ["orbNod3dDurationMs", "orbNod3dDurationMs"],
  ["orbNod3dFillAlpha", "orbNod3dFillAlpha"],
  ["orbNod3dWaveCount", "orbNod3dWaveCount"],
  ["orbNod3dLatitudinalBands", "orbNod3dLatitudinalBands"],
  ["orbNod3dWaveDepthBO", "orbNod3dWaveDepthBO"],
  ["orbNod3dOscillationSpeedHz", "orbNod3dOscillationSpeedHz"],
  ["orbNod3dOscillationCount", "orbNod3dOscillationCount"],
  ["orbNod3dEquatorFalloff", "orbNod3dEquatorFalloff"],
  ["orbNod3dRippleSoftness", "orbNod3dRippleSoftness"],
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

export function createOrbNod3dAuthoringAdapter({
  orbNod3dPresetDefault = {},
} = {}) {
  function defaultSettings() {
    return {
      orbNod3dShrinkPct: roundedNumber(orbNod3dPresetDefault.orbNod3dShrinkPct, 2),
      orbNod3dDurationMs: roundedNumber(orbNod3dPresetDefault.orbNod3dDurationMs, 520),
      orbNod3dFillAlpha: fixedNumber(orbNod3dPresetDefault.orbNod3dFillAlpha, 2, 0.07),
      orbNod3dWaveCount: roundedNumber(orbNod3dPresetDefault.orbNod3dWaveCount, 4),
      orbNod3dLatitudinalBands: roundedNumber(orbNod3dPresetDefault.orbNod3dLatitudinalBands, 4),
      orbNod3dWaveDepthBO: fixedNumber(orbNod3dPresetDefault.orbNod3dWaveDepthBO, 3, 0.024),
      orbNod3dOscillationSpeedHz: fixedNumber(orbNod3dPresetDefault.orbNod3dOscillationSpeedHz, 1, 4.8),
      orbNod3dOscillationCount: roundedNumber(orbNod3dPresetDefault.orbNod3dOscillationCount, 2),
      orbNod3dEquatorFalloff: fixedNumber(orbNod3dPresetDefault.orbNod3dEquatorFalloff, 2, 0),
      orbNod3dRippleSoftness: fixedNumber(orbNod3dPresetDefault.orbNod3dRippleSoftness, 2, 0.82),
    };
  }

  function capture(els) {
    return Object.fromEntries(ORB_NOD_3D_FIELDS.map(([fieldKey, settingsKey]) => [
      settingsKey,
      Number(els && els[fieldKey] && els[fieldKey].value),
    ]));
  }

  function apply(els, settings, { applyPreview = null } = {}) {
    if (!els || !settings || typeof settings !== "object") return false;
    ORB_NOD_3D_FIELDS.forEach(([fieldKey, settingsKey]) => {
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
