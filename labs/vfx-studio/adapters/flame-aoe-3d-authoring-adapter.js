const FLAME_AOE_3D_FIELDS = Object.freeze([
  ["flameAoe3dShellAlpha", "shellAlpha"],
  ["flameAoe3dDisplace", "displace"],
  ["flameAoe3dNoiseScale", "noiseScale"],
  ["flameAoe3dNoiseSpeed", "noiseSpeed"],
  ["flameAoe3dEdgeCut", "edgeCut"],
  ["flameAoe3dFresnelPower", "fresnelPower"],
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
  ["flameAoe3dCoreR", "coreR"],
  ["flameAoe3dCoreG", "coreG"],
  ["flameAoe3dCoreB", "coreB"],
  ["flameAoe3dHotR", "hotR"],
  ["flameAoe3dHotG", "hotG"],
  ["flameAoe3dHotB", "hotB"],
  ["flameAoe3dRimR", "rimR"],
  ["flameAoe3dRimG", "rimG"],
  ["flameAoe3dRimB", "rimB"],
  ["flameAoe3dSmokeR", "smokeR"],
  ["flameAoe3dSmokeG", "smokeG"],
  ["flameAoe3dSmokeB", "smokeB"],
]);

const FLAME_AOE_3D_DEFAULTS = Object.freeze({
  shellAlpha: 0.82,
  displace: 0.16,
  noiseScale: 2.65,
  noiseSpeed: 0.72,
  edgeCut: 0.46,
  fresnelPower: 2.2,
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
  coreR: 255,
  coreG: 42,
  coreB: 5,
  hotR: 255,
  hotG: 176,
  hotB: 0,
  rimR: 255,
  rimG: 241,
  rimB: 181,
  smokeR: 42,
  smokeG: 7,
  smokeB: 2,
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

export function createFlameAoe3dAuthoringAdapter() {
  function defaultSettings() {
    return { ...FLAME_AOE_3D_DEFAULTS };
  }

  function capture(els) {
    return Object.freeze({
      shellAlpha: fixedNumber(els && els.flameAoe3dShellAlpha && els.flameAoe3dShellAlpha.value, 2, FLAME_AOE_3D_DEFAULTS.shellAlpha),
      displace: fixedNumber(els && els.flameAoe3dDisplace && els.flameAoe3dDisplace.value, 3, FLAME_AOE_3D_DEFAULTS.displace),
      noiseScale: fixedNumber(els && els.flameAoe3dNoiseScale && els.flameAoe3dNoiseScale.value, 2, FLAME_AOE_3D_DEFAULTS.noiseScale),
      noiseSpeed: fixedNumber(els && els.flameAoe3dNoiseSpeed && els.flameAoe3dNoiseSpeed.value, 2, FLAME_AOE_3D_DEFAULTS.noiseSpeed),
      edgeCut: fixedNumber(els && els.flameAoe3dEdgeCut && els.flameAoe3dEdgeCut.value, 2, FLAME_AOE_3D_DEFAULTS.edgeCut),
      fresnelPower: fixedNumber(els && els.flameAoe3dFresnelPower && els.flameAoe3dFresnelPower.value, 2, FLAME_AOE_3D_DEFAULTS.fresnelPower),
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
      coreR: roundedByte(els && els.flameAoe3dCoreR && els.flameAoe3dCoreR.value, FLAME_AOE_3D_DEFAULTS.coreR),
      coreG: roundedByte(els && els.flameAoe3dCoreG && els.flameAoe3dCoreG.value, FLAME_AOE_3D_DEFAULTS.coreG),
      coreB: roundedByte(els && els.flameAoe3dCoreB && els.flameAoe3dCoreB.value, FLAME_AOE_3D_DEFAULTS.coreB),
      hotR: roundedByte(els && els.flameAoe3dHotR && els.flameAoe3dHotR.value, FLAME_AOE_3D_DEFAULTS.hotR),
      hotG: roundedByte(els && els.flameAoe3dHotG && els.flameAoe3dHotG.value, FLAME_AOE_3D_DEFAULTS.hotG),
      hotB: roundedByte(els && els.flameAoe3dHotB && els.flameAoe3dHotB.value, FLAME_AOE_3D_DEFAULTS.hotB),
      rimR: roundedByte(els && els.flameAoe3dRimR && els.flameAoe3dRimR.value, FLAME_AOE_3D_DEFAULTS.rimR),
      rimG: roundedByte(els && els.flameAoe3dRimG && els.flameAoe3dRimG.value, FLAME_AOE_3D_DEFAULTS.rimG),
      rimB: roundedByte(els && els.flameAoe3dRimB && els.flameAoe3dRimB.value, FLAME_AOE_3D_DEFAULTS.rimB),
      smokeR: roundedByte(els && els.flameAoe3dSmokeR && els.flameAoe3dSmokeR.value, FLAME_AOE_3D_DEFAULTS.smokeR),
      smokeG: roundedByte(els && els.flameAoe3dSmokeG && els.flameAoe3dSmokeG.value, FLAME_AOE_3D_DEFAULTS.smokeG),
      smokeB: roundedByte(els && els.flameAoe3dSmokeB && els.flameAoe3dSmokeB.value, FLAME_AOE_3D_DEFAULTS.smokeB),
    });
  }

  function apply(_els, _settings, { applyPreview = null } = {}) {
    const els = _els || {};
    const settings = _settings && typeof _settings === "object" ? _settings : FLAME_AOE_3D_DEFAULTS;
    FLAME_AOE_3D_FIELDS.forEach(([fieldKey, settingsKey]) => {
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
