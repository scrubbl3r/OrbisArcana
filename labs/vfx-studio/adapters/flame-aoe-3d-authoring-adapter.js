const FLAME_AOE_3D_FIELDS = Object.freeze([
  ["flameAoe3dAuraAlpha", "auraAlpha"],
  ["flameAoe3dAuraScale", "auraScale"],
  ["flameAoe3dAuraPulse", "auraPulse"],
  ["flameAoe3dAuraNoiseScale", "auraNoiseScale"],
  ["flameAoe3dAuraNoiseSpeed", "auraNoiseSpeed"],
  ["flameAoe3dAuraFresnelPower", "auraFresnelPower"],
  ["flameAoe3dAuraR", "auraR"],
  ["flameAoe3dAuraG", "auraG"],
  ["flameAoe3dAuraB", "auraB"],
  ["flameAoe3dWakeLengthBo", "wakeLengthBo"],
  ["flameAoe3dWakeRadiusBo", "wakeRadiusBo"],
  ["flameAoe3dWakeSubdivisions", "wakeSubdivisions"],
  ["flameAoe3dWakeLeanAmount", "wakeLeanAmount"],
  ["flameAoe3dWakeLeanLag", "wakeLeanLag"],
  ["flameAoe3dWakeLiftBo", "wakeLiftBo"],
  ["flameAoe3dWakeLiftCoreRadiusBo", "wakeLiftCoreRadiusBo"],
  ["flameAoe3dWakeStretchStrength", "wakeStretchStrength"],
  ["flameAoe3dWakeOrbHugRadiusBo", "wakeOrbHugRadiusBo"],
  ["flameAoe3dWakeEnvelopeBlendBo", "wakeEnvelopeBlendBo"],
  ["flameAoe3dWakeDisplaceBo", "wakeDisplaceBo"],
  ["flameAoe3dWakeDisplaceScale", "wakeDisplaceScale"],
  ["flameAoe3dWakeDisplaceSpeed", "wakeDisplaceSpeed"],
  ["flameAoe3dWakeDisplaceSoftness", "wakeDisplaceSoftness"],
  ["flameAoe3dWakeDisplaceInfluenceBottom", "wakeDisplaceInfluenceBottom"],
  ["flameAoe3dWakeDisplaceInfluenceTop", "wakeDisplaceInfluenceTop"],
  ["flameAoe3dWakeNoiseScale", "wakeNoiseScale"],
  ["flameAoe3dWakeNoiseSpeed", "wakeNoiseSpeed"],
  ["flameAoe3dWakeNoiseDensityBottom", "wakeNoiseDensityBottom"],
  ["flameAoe3dWakeNoiseDensityTop", "wakeNoiseDensityTop"],
  ["flameAoe3dWakeNoiseContrast", "wakeNoiseContrast"],
  ["flameAoe3dWakeNoiseOctaves", "wakeNoiseOctaves"],
  ["flameAoe3dWakeNoiseLacunarity", "wakeNoiseLacunarity"],
  ["flameAoe3dWakeNoiseGain", "wakeNoiseGain"],
  ["flameAoe3dWakeSimplexScale", "wakeSimplexScale"],
  ["flameAoe3dWakeSimplexSpeed", "wakeSimplexSpeed"],
  ["flameAoe3dWakeSimplexDensityBottom", "wakeSimplexDensityBottom"],
  ["flameAoe3dWakeSimplexDensityTop", "wakeSimplexDensityTop"],
  ["flameAoe3dWakeSimplexContrast", "wakeSimplexContrast"],
  ["flameAoe3dWakeSimplexOctaves", "wakeSimplexOctaves"],
  ["flameAoe3dWakeSimplexLacunarity", "wakeSimplexLacunarity"],
  ["flameAoe3dWakeSimplexGain", "wakeSimplexGain"],
  ["flameAoe3dWakeNoiseMix", "wakeNoiseMix"],
  ["flameAoe3dWakeGraph0Pct", "wakeGraph0Pct"],
  ["flameAoe3dWakeGraph0R", "wakeGraph0R"],
  ["flameAoe3dWakeGraph0G", "wakeGraph0G"],
  ["flameAoe3dWakeGraph0B", "wakeGraph0B"],
  ["flameAoe3dWakeGraph0A", "wakeGraph0A"],
  ["flameAoe3dWakeGraph1Pct", "wakeGraph1Pct"],
  ["flameAoe3dWakeGraph1R", "wakeGraph1R"],
  ["flameAoe3dWakeGraph1G", "wakeGraph1G"],
  ["flameAoe3dWakeGraph1B", "wakeGraph1B"],
  ["flameAoe3dWakeGraph1A", "wakeGraph1A"],
  ["flameAoe3dWakeGraph2Pct", "wakeGraph2Pct"],
  ["flameAoe3dWakeGraph2R", "wakeGraph2R"],
  ["flameAoe3dWakeGraph2G", "wakeGraph2G"],
  ["flameAoe3dWakeGraph2B", "wakeGraph2B"],
  ["flameAoe3dWakeGraph2A", "wakeGraph2A"],
  ["flameAoe3dWakeGraph3Pct", "wakeGraph3Pct"],
  ["flameAoe3dWakeGraph3R", "wakeGraph3R"],
  ["flameAoe3dWakeGraph3G", "wakeGraph3G"],
  ["flameAoe3dWakeGraph3B", "wakeGraph3B"],
  ["flameAoe3dWakeGraph3A", "wakeGraph3A"],
  ["flameAoe3dWakeAlphaGradient0Pct", "wakeAlphaGradient0Pct"],
  ["flameAoe3dWakeAlphaGradient0A", "wakeAlphaGradient0A"],
  ["flameAoe3dWakeAlphaGradient1Pct", "wakeAlphaGradient1Pct"],
  ["flameAoe3dWakeAlphaGradient1A", "wakeAlphaGradient1A"],
  ["flameAoe3dWakeAlphaGradient2Pct", "wakeAlphaGradient2Pct"],
  ["flameAoe3dWakeAlphaGradient2A", "wakeAlphaGradient2A"],
  ["flameAoe3dWakeAlphaGradient3Pct", "wakeAlphaGradient3Pct"],
  ["flameAoe3dWakeAlphaGradient3A", "wakeAlphaGradient3A"],
  ["flameAoe3dWakeGraphEnabled", "wakeGraphEnabled"],
]);

const FLAME_AOE_3D_DEFAULTS = Object.freeze({
  auraAlpha: 0.34,
  auraScale: 1.34,
  auraPulse: 0.08,
  auraNoiseScale: 1.55,
  auraNoiseSpeed: 0.24,
  auraFresnelPower: 1.35,
  auraR: 255,
  auraG: 106,
  auraB: 24,
  wakeLengthBo: 0.95,
  wakeRadiusBo: 0.5,
  wakeSubdivisions: 64,
  wakeLeanAmount: 80,
  wakeLeanLag: 40,
  wakeLiftBo: 1.1,
  wakeLiftCoreRadiusBo: 0.25,
  wakeStretchStrength: 1.35,
  wakeOrbHugRadiusBo: 0.22,
  wakeEnvelopeBlendBo: 0.06,
  wakeDisplaceEnabled: 1,
  wakeDisplaceBo: 0.12,
  wakeDisplaceScale: 1.8,
  wakeDisplaceSpeed: 0.35,
  wakeDisplaceSoftness: 0.7,
  wakeDisplaceInfluenceBottom: 0.35,
  wakeDisplaceInfluenceTop: 0.85,
  wakeNoiseScale: 2.35,
  wakeNoiseSpeed: 0.86,
  wakeNoiseDensityBottom: 0.52,
  wakeNoiseDensityTop: 0.52,
  wakeNoiseContrast: 0.16,
  wakeNoiseOctaves: 5,
  wakeNoiseLacunarity: 2.08,
  wakeNoiseGain: 0.52,
  wakeSimplexScale: 0.85,
  wakeSimplexSpeed: 2.2,
  wakeSimplexDensityBottom: 0.56,
  wakeSimplexDensityTop: 0.32,
  wakeSimplexContrast: 0.18,
  wakeSimplexOctaves: 4,
  wakeSimplexLacunarity: 2.25,
  wakeSimplexGain: 0.48,
  wakeNoiseMix: 0.35,
  wakeGraph0Pct: 0,
  wakeGraph0R: 0,
  wakeGraph0G: 0,
  wakeGraph0B: 0,
  wakeGraph0A: 0,
  wakeGraph1Pct: 100,
  wakeGraph1R: 255,
  wakeGraph1G: 255,
  wakeGraph1B: 255,
  wakeGraph1A: 1,
  wakeGraph2Pct: "",
  wakeGraph2R: "",
  wakeGraph2G: "",
  wakeGraph2B: "",
  wakeGraph2A: "",
  wakeGraph3Pct: "",
  wakeGraph3R: "",
  wakeGraph3G: "",
  wakeGraph3B: "",
  wakeGraph3A: "",
  wakeAlphaGradient0Pct: 0,
  wakeAlphaGradient0A: 1,
  wakeAlphaGradient1Pct: 100,
  wakeAlphaGradient1A: 1,
  wakeAlphaGradient2Pct: "",
  wakeAlphaGradient2A: "",
  wakeAlphaGradient3Pct: "",
  wakeAlphaGradient3A: "",
  wakeGraphEnabled: 1,
});

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const f = Number.isFinite(Number(fallback)) ? Number(fallback) : min;
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : f));
}

function fixedNumber(value, digits, fallback = 0) {
  return Number(clampNumber(value, -Infinity, Infinity, fallback).toFixed(digits));
}

function roundedByte(value, fallback = 0) {
  return Math.round(clampNumber(value, 0, 255, fallback));
}

function optionalNumber(value, min, max) {
  if (value == null || String(value).trim() === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return Math.max(min, Math.min(max, n));
}

export function createFlameAoe3dAuthoringAdapter() {
  function defaultSettings() {
    return { ...FLAME_AOE_3D_DEFAULTS };
  }

  function capture(els) {
    return Object.freeze({
      auraAlpha: fixedNumber(els && els.flameAoe3dAuraAlpha && els.flameAoe3dAuraAlpha.value, 2, FLAME_AOE_3D_DEFAULTS.auraAlpha),
      auraScale: fixedNumber(els && els.flameAoe3dAuraScale && els.flameAoe3dAuraScale.value, 2, FLAME_AOE_3D_DEFAULTS.auraScale),
      auraPulse: fixedNumber(els && els.flameAoe3dAuraPulse && els.flameAoe3dAuraPulse.value, 3, FLAME_AOE_3D_DEFAULTS.auraPulse),
      auraNoiseScale: fixedNumber(els && els.flameAoe3dAuraNoiseScale && els.flameAoe3dAuraNoiseScale.value, 2, FLAME_AOE_3D_DEFAULTS.auraNoiseScale),
      auraNoiseSpeed: fixedNumber(els && els.flameAoe3dAuraNoiseSpeed && els.flameAoe3dAuraNoiseSpeed.value, 2, FLAME_AOE_3D_DEFAULTS.auraNoiseSpeed),
      auraFresnelPower: fixedNumber(els && els.flameAoe3dAuraFresnelPower && els.flameAoe3dAuraFresnelPower.value, 2, FLAME_AOE_3D_DEFAULTS.auraFresnelPower),
      auraR: roundedByte(els && els.flameAoe3dAuraR && els.flameAoe3dAuraR.value, FLAME_AOE_3D_DEFAULTS.auraR),
      auraG: roundedByte(els && els.flameAoe3dAuraG && els.flameAoe3dAuraG.value, FLAME_AOE_3D_DEFAULTS.auraG),
      auraB: roundedByte(els && els.flameAoe3dAuraB && els.flameAoe3dAuraB.value, FLAME_AOE_3D_DEFAULTS.auraB),
      wakeLengthBo: fixedNumber(els && els.flameAoe3dWakeLengthBo && els.flameAoe3dWakeLengthBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeLengthBo),
      wakeRadiusBo: fixedNumber(els && els.flameAoe3dWakeRadiusBo && els.flameAoe3dWakeRadiusBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeRadiusBo),
      wakeSubdivisions: Math.round(clampNumber(els && els.flameAoe3dWakeSubdivisions && els.flameAoe3dWakeSubdivisions.value, 12, 192, FLAME_AOE_3D_DEFAULTS.wakeSubdivisions)),
      wakeLeanAmount: fixedNumber(els && els.flameAoe3dWakeLeanAmount && els.flameAoe3dWakeLeanAmount.value, 2, FLAME_AOE_3D_DEFAULTS.wakeLeanAmount),
      wakeLeanLag: fixedNumber(els && els.flameAoe3dWakeLeanLag && els.flameAoe3dWakeLeanLag.value, 2, FLAME_AOE_3D_DEFAULTS.wakeLeanLag),
      wakeLiftBo: fixedNumber(els && els.flameAoe3dWakeLiftBo && els.flameAoe3dWakeLiftBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeLiftBo),
      wakeLiftCoreRadiusBo: fixedNumber(els && els.flameAoe3dWakeLiftCoreRadiusBo && els.flameAoe3dWakeLiftCoreRadiusBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeLiftCoreRadiusBo),
      wakeStretchStrength: fixedNumber(els && els.flameAoe3dWakeStretchStrength && els.flameAoe3dWakeStretchStrength.value, 2, FLAME_AOE_3D_DEFAULTS.wakeStretchStrength),
      wakeOrbHugRadiusBo: fixedNumber(els && els.flameAoe3dWakeOrbHugRadiusBo && els.flameAoe3dWakeOrbHugRadiusBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeOrbHugRadiusBo),
      wakeEnvelopeBlendBo: fixedNumber(els && els.flameAoe3dWakeEnvelopeBlendBo && els.flameAoe3dWakeEnvelopeBlendBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeEnvelopeBlendBo),
      wakeDisplaceEnabled: (els && els.flameAoe3dWakeDisplaceVisibleBtn && els.flameAoe3dWakeDisplaceVisibleBtn.getAttribute("aria-pressed") === "false") ? 0 : 1,
      wakeDisplaceBo: fixedNumber(els && els.flameAoe3dWakeDisplaceBo && els.flameAoe3dWakeDisplaceBo.value, 3, FLAME_AOE_3D_DEFAULTS.wakeDisplaceBo),
      wakeDisplaceScale: fixedNumber(els && els.flameAoe3dWakeDisplaceScale && els.flameAoe3dWakeDisplaceScale.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDisplaceScale),
      wakeDisplaceSpeed: fixedNumber(els && els.flameAoe3dWakeDisplaceSpeed && els.flameAoe3dWakeDisplaceSpeed.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDisplaceSpeed),
      wakeDisplaceSoftness: fixedNumber(els && els.flameAoe3dWakeDisplaceSoftness && els.flameAoe3dWakeDisplaceSoftness.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDisplaceSoftness),
      wakeDisplaceInfluenceBottom: fixedNumber(els && els.flameAoe3dWakeDisplaceInfluenceBottom && els.flameAoe3dWakeDisplaceInfluenceBottom.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDisplaceInfluenceBottom),
      wakeDisplaceInfluenceTop: fixedNumber(els && els.flameAoe3dWakeDisplaceInfluenceTop && els.flameAoe3dWakeDisplaceInfluenceTop.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDisplaceInfluenceTop),
      wakeNoiseScale: fixedNumber(els && els.flameAoe3dWakeNoiseScale && els.flameAoe3dWakeNoiseScale.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseScale),
      wakeNoiseSpeed: fixedNumber(els && els.flameAoe3dWakeNoiseSpeed && els.flameAoe3dWakeNoiseSpeed.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseSpeed),
      wakeNoiseDensityBottom: fixedNumber(els && els.flameAoe3dWakeNoiseDensityBottom && els.flameAoe3dWakeNoiseDensityBottom.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseDensityBottom),
      wakeNoiseDensityTop: fixedNumber(els && els.flameAoe3dWakeNoiseDensityTop && els.flameAoe3dWakeNoiseDensityTop.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseDensityTop),
      wakeNoiseContrast: fixedNumber(els && els.flameAoe3dWakeNoiseContrast && els.flameAoe3dWakeNoiseContrast.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseContrast),
      wakeNoiseOctaves: Math.round(clampNumber(els && els.flameAoe3dWakeNoiseOctaves && els.flameAoe3dWakeNoiseOctaves.value, 1, 8, FLAME_AOE_3D_DEFAULTS.wakeNoiseOctaves)),
      wakeNoiseLacunarity: fixedNumber(els && els.flameAoe3dWakeNoiseLacunarity && els.flameAoe3dWakeNoiseLacunarity.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseLacunarity),
      wakeNoiseGain: fixedNumber(els && els.flameAoe3dWakeNoiseGain && els.flameAoe3dWakeNoiseGain.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseGain),
      wakeSimplexScale: fixedNumber(els && els.flameAoe3dWakeSimplexScale && els.flameAoe3dWakeSimplexScale.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSimplexScale),
      wakeSimplexSpeed: fixedNumber(els && els.flameAoe3dWakeSimplexSpeed && els.flameAoe3dWakeSimplexSpeed.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSimplexSpeed),
      wakeSimplexDensityBottom: fixedNumber(els && els.flameAoe3dWakeSimplexDensityBottom && els.flameAoe3dWakeSimplexDensityBottom.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSimplexDensityBottom),
      wakeSimplexDensityTop: fixedNumber(els && els.flameAoe3dWakeSimplexDensityTop && els.flameAoe3dWakeSimplexDensityTop.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSimplexDensityTop),
      wakeSimplexContrast: fixedNumber(els && els.flameAoe3dWakeSimplexContrast && els.flameAoe3dWakeSimplexContrast.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSimplexContrast),
      wakeSimplexOctaves: Math.round(clampNumber(els && els.flameAoe3dWakeSimplexOctaves && els.flameAoe3dWakeSimplexOctaves.value, 1, 8, FLAME_AOE_3D_DEFAULTS.wakeSimplexOctaves)),
      wakeSimplexLacunarity: fixedNumber(els && els.flameAoe3dWakeSimplexLacunarity && els.flameAoe3dWakeSimplexLacunarity.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSimplexLacunarity),
      wakeSimplexGain: fixedNumber(els && els.flameAoe3dWakeSimplexGain && els.flameAoe3dWakeSimplexGain.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSimplexGain),
      wakeNoiseMix: fixedNumber(els && els.flameAoe3dWakeNoiseMix && els.flameAoe3dWakeNoiseMix.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseMix),
      wakeGraph0Pct: optionalNumber(els && els.flameAoe3dWakeGraph0Pct && els.flameAoe3dWakeGraph0Pct.value, 0, 100),
      wakeGraph0R: optionalNumber(els && els.flameAoe3dWakeGraph0R && els.flameAoe3dWakeGraph0R.value, 0, 255),
      wakeGraph0G: optionalNumber(els && els.flameAoe3dWakeGraph0G && els.flameAoe3dWakeGraph0G.value, 0, 255),
      wakeGraph0B: optionalNumber(els && els.flameAoe3dWakeGraph0B && els.flameAoe3dWakeGraph0B.value, 0, 255),
      wakeGraph0A: optionalNumber(els && els.flameAoe3dWakeGraph0A && els.flameAoe3dWakeGraph0A.value, 0, 1),
      wakeGraph1Pct: optionalNumber(els && els.flameAoe3dWakeGraph1Pct && els.flameAoe3dWakeGraph1Pct.value, 0, 100),
      wakeGraph1R: optionalNumber(els && els.flameAoe3dWakeGraph1R && els.flameAoe3dWakeGraph1R.value, 0, 255),
      wakeGraph1G: optionalNumber(els && els.flameAoe3dWakeGraph1G && els.flameAoe3dWakeGraph1G.value, 0, 255),
      wakeGraph1B: optionalNumber(els && els.flameAoe3dWakeGraph1B && els.flameAoe3dWakeGraph1B.value, 0, 255),
      wakeGraph1A: optionalNumber(els && els.flameAoe3dWakeGraph1A && els.flameAoe3dWakeGraph1A.value, 0, 1),
      wakeGraph2Pct: optionalNumber(els && els.flameAoe3dWakeGraph2Pct && els.flameAoe3dWakeGraph2Pct.value, 0, 100),
      wakeGraph2R: optionalNumber(els && els.flameAoe3dWakeGraph2R && els.flameAoe3dWakeGraph2R.value, 0, 255),
      wakeGraph2G: optionalNumber(els && els.flameAoe3dWakeGraph2G && els.flameAoe3dWakeGraph2G.value, 0, 255),
      wakeGraph2B: optionalNumber(els && els.flameAoe3dWakeGraph2B && els.flameAoe3dWakeGraph2B.value, 0, 255),
      wakeGraph2A: optionalNumber(els && els.flameAoe3dWakeGraph2A && els.flameAoe3dWakeGraph2A.value, 0, 1),
      wakeGraph3Pct: optionalNumber(els && els.flameAoe3dWakeGraph3Pct && els.flameAoe3dWakeGraph3Pct.value, 0, 100),
      wakeGraph3R: optionalNumber(els && els.flameAoe3dWakeGraph3R && els.flameAoe3dWakeGraph3R.value, 0, 255),
      wakeGraph3G: optionalNumber(els && els.flameAoe3dWakeGraph3G && els.flameAoe3dWakeGraph3G.value, 0, 255),
      wakeGraph3B: optionalNumber(els && els.flameAoe3dWakeGraph3B && els.flameAoe3dWakeGraph3B.value, 0, 255),
      wakeGraph3A: optionalNumber(els && els.flameAoe3dWakeGraph3A && els.flameAoe3dWakeGraph3A.value, 0, 1),
      wakeAlphaGradient0Pct: optionalNumber(els && els.flameAoe3dWakeAlphaGradient0Pct && els.flameAoe3dWakeAlphaGradient0Pct.value, 0, 100),
      wakeAlphaGradient0A: optionalNumber(els && els.flameAoe3dWakeAlphaGradient0A && els.flameAoe3dWakeAlphaGradient0A.value, 0, 1),
      wakeAlphaGradient1Pct: optionalNumber(els && els.flameAoe3dWakeAlphaGradient1Pct && els.flameAoe3dWakeAlphaGradient1Pct.value, 0, 100),
      wakeAlphaGradient1A: optionalNumber(els && els.flameAoe3dWakeAlphaGradient1A && els.flameAoe3dWakeAlphaGradient1A.value, 0, 1),
      wakeAlphaGradient2Pct: optionalNumber(els && els.flameAoe3dWakeAlphaGradient2Pct && els.flameAoe3dWakeAlphaGradient2Pct.value, 0, 100),
      wakeAlphaGradient2A: optionalNumber(els && els.flameAoe3dWakeAlphaGradient2A && els.flameAoe3dWakeAlphaGradient2A.value, 0, 1),
      wakeAlphaGradient3Pct: optionalNumber(els && els.flameAoe3dWakeAlphaGradient3Pct && els.flameAoe3dWakeAlphaGradient3Pct.value, 0, 100),
      wakeAlphaGradient3A: optionalNumber(els && els.flameAoe3dWakeAlphaGradient3A && els.flameAoe3dWakeAlphaGradient3A.value, 0, 1),
      wakeGraphEnabled: (els && els.flameAoe3dWakeGraphEnabled && String(els.flameAoe3dWakeGraphEnabled.value) === "0") ? 0 : 1,
    });
  }

  function apply(_els, _settings, { applyPreview = null } = {}) {
    const els = _els || {};
    const settings = _settings && typeof _settings === "object" ? _settings : FLAME_AOE_3D_DEFAULTS;
    FLAME_AOE_3D_FIELDS.forEach(([fieldKey, settingsKey]) => {
      if (els[fieldKey] && settings[settingsKey] != null) els[fieldKey].value = String(settings[settingsKey]);
    });
    if (els.flameAoe3dWakeGraphVisibleBtn && settings.wakeGraphEnabled != null) {
      els.flameAoe3dWakeGraphVisibleBtn.setAttribute("aria-pressed", String(settings.wakeGraphEnabled) === "0" ? "false" : "true");
    }
    if (els.flameAoe3dWakeDisplaceVisibleBtn && settings.wakeDisplaceEnabled != null) {
      els.flameAoe3dWakeDisplaceVisibleBtn.setAttribute("aria-pressed", String(settings.wakeDisplaceEnabled) === "0" ? "false" : "true");
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
