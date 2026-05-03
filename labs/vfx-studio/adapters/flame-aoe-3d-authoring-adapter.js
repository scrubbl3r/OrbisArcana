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
  ["flameAoe3dWakeAlpha", "wakeAlpha"],
  ["flameAoe3dWakeLengthBo", "wakeLengthBo"],
  ["flameAoe3dWakeRadiusBo", "wakeRadiusBo"],
  ["flameAoe3dWakeBend", "wakeBend"],
  ["flameAoe3dWakeNoiseScale", "wakeNoiseScale"],
  ["flameAoe3dWakeNoiseSpeed", "wakeNoiseSpeed"],
  ["flameAoe3dWakeSoftness", "wakeSoftness"],
  ["flameAoe3dWakeDirX", "wakeDirX"],
  ["flameAoe3dWakeDirY", "wakeDirY"],
  ["flameAoe3dWakeDirZ", "wakeDirZ"],
  ["flameAoe3dWakeR", "wakeR"],
  ["flameAoe3dWakeG", "wakeG"],
  ["flameAoe3dWakeB", "wakeB"],
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
  wakeAlpha: 0.46,
  wakeLengthBo: 0.95,
  wakeRadiusBo: 0.34,
  wakeBend: 0.22,
  wakeNoiseScale: 2.35,
  wakeNoiseSpeed: 0.86,
  wakeSoftness: 0.38,
  wakeDirX: -0.85,
  wakeDirY: 0.12,
  wakeDirZ: 0.18,
  wakeR: 255,
  wakeG: 122,
  wakeB: 18,
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
      wakeAlpha: fixedNumber(els && els.flameAoe3dWakeAlpha && els.flameAoe3dWakeAlpha.value, 2, FLAME_AOE_3D_DEFAULTS.wakeAlpha),
      wakeLengthBo: fixedNumber(els && els.flameAoe3dWakeLengthBo && els.flameAoe3dWakeLengthBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeLengthBo),
      wakeRadiusBo: fixedNumber(els && els.flameAoe3dWakeRadiusBo && els.flameAoe3dWakeRadiusBo.value, 2, FLAME_AOE_3D_DEFAULTS.wakeRadiusBo),
      wakeBend: fixedNumber(els && els.flameAoe3dWakeBend && els.flameAoe3dWakeBend.value, 2, FLAME_AOE_3D_DEFAULTS.wakeBend),
      wakeNoiseScale: fixedNumber(els && els.flameAoe3dWakeNoiseScale && els.flameAoe3dWakeNoiseScale.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseScale),
      wakeNoiseSpeed: fixedNumber(els && els.flameAoe3dWakeNoiseSpeed && els.flameAoe3dWakeNoiseSpeed.value, 2, FLAME_AOE_3D_DEFAULTS.wakeNoiseSpeed),
      wakeSoftness: fixedNumber(els && els.flameAoe3dWakeSoftness && els.flameAoe3dWakeSoftness.value, 2, FLAME_AOE_3D_DEFAULTS.wakeSoftness),
      wakeDirX: fixedNumber(els && els.flameAoe3dWakeDirX && els.flameAoe3dWakeDirX.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDirX),
      wakeDirY: fixedNumber(els && els.flameAoe3dWakeDirY && els.flameAoe3dWakeDirY.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDirY),
      wakeDirZ: fixedNumber(els && els.flameAoe3dWakeDirZ && els.flameAoe3dWakeDirZ.value, 2, FLAME_AOE_3D_DEFAULTS.wakeDirZ),
      wakeR: roundedByte(els && els.flameAoe3dWakeR && els.flameAoe3dWakeR.value, FLAME_AOE_3D_DEFAULTS.wakeR),
      wakeG: roundedByte(els && els.flameAoe3dWakeG && els.flameAoe3dWakeG.value, FLAME_AOE_3D_DEFAULTS.wakeG),
      wakeB: roundedByte(els && els.flameAoe3dWakeB && els.flameAoe3dWakeB.value, FLAME_AOE_3D_DEFAULTS.wakeB),
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
