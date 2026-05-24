import { TESLA_1_PRESET_DEFAULT } from "../../../src/vfx/presets/tesla-1-default.js";
import { createElectricAoe3dAuthoringAdapter } from "./electric-aoe-3d-authoring-adapter.js?v=20260522-softness-a";

const TESLA_TO_ELECTRIC_ELEMENT_KEYS = Object.freeze({
  tesla1BoltShaderEnabled: "electricAoe3dBoltShaderEnabled",
  tesla1HaloFieldEnabled: "electricAoe3dHaloFieldEnabled",
  tesla1HaloFieldShellRadiusBo: "electricAoe3dHaloFieldShellRadiusBo",
  tesla1HaloFieldBoltStartMinBo: "electricAoe3dHaloFieldBoltStartMinBo",
  tesla1HaloFieldBoltStartMaxBo: "electricAoe3dHaloFieldBoltStartMaxBo",
  tesla1HaloFieldBoltEndMinBo: "electricAoe3dHaloFieldBoltEndMinBo",
  tesla1HaloFieldBoltEndMaxBo: "electricAoe3dHaloFieldBoltEndMaxBo",
  tesla1HaloFieldZMinBo: "electricAoe3dHaloFieldZMinBo",
  tesla1HaloFieldZMaxBo: "electricAoe3dHaloFieldZMaxBo",
  tesla1MasterBoltMinRangeBo: "electricAoe3dDominantBoltMinRangeBo",
  tesla1MasterBoltMaxRangeBo: "electricAoe3dDominantBoltMaxRangeBo",
  tesla1MasterBoltContactRadiusBo: "electricAoe3dDominantBoltTargetRadiusBo",
  tesla1MasterBoltPathBendAllowance: "electricAoe3dDominantBoltDetourRatioMax",
});

function readNumber(el, fallback, min = -Infinity, max = Infinity) {
  const numeric = Number(el && el.value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function mapTeslaElsToElectric(els = {}) {
  const mapped = { ...els };
  for (const [teslaKey, electricKey] of Object.entries(TESLA_TO_ELECTRIC_ELEMENT_KEYS)) {
    mapped[electricKey] = els[teslaKey] || mapped[electricKey] || null;
  }
  mapped.electricAoe3dControlPointsVisibleBtn = els.tesla1MasterBoltVisibleBtn || null;
  mapped.electricAoe3dHaloFieldVisibleBtn = els.tesla1HaloVisibleBtn || null;
  mapped.electricAoe3dBoltShaderVisibleBtn = els.tesla1LightningShaderVisibleBtn || null;
  mapped.electricAoe3dOrbVisibleBtn = els.tesla1OrbVisibleBtn || null;
  return mapped;
}

export function createTesla1AuthoringAdapter({
  tesla1PresetDefault = TESLA_1_PRESET_DEFAULT,
} = {}) {
  const electricAdapter = createElectricAoe3dAuthoringAdapter({
    electricAoe3dPresetDefault: tesla1PresetDefault,
    electricAoe3dBehaviorDefault: {},
  });

  function defaultSettings() {
    return { ...tesla1PresetDefault };
  }

  function capture(els = {}) {
    const mappedEls = mapTeslaElsToElectric(els);
    const captured = { ...electricAdapter.capture(mappedEls) };
    [
      "boltShaderCoreWidthMinBo", "boltShaderCoreWidthMaxBo", "boltShaderGlowWidthMinBo", "boltShaderGlowWidthMaxBo",
      "boltShaderLengthTaper", "boltShaderTipOpacity", "boltShaderCoreIntensity", "boltShaderCoreSoftness",
      "boltShaderGlowIntensity", "boltShaderGlowSoftness", "boltShaderCoreR", "boltShaderCoreG", "boltShaderCoreB",
      "boltShaderGlowR", "boltShaderGlowG", "boltShaderGlowB", "boltShaderCoreA", "boltShaderGlowA",
      "boltShaderCentralCoreEnabled", "boltShaderCentralCoreRadiusBo", "boltShaderCentralCoreGlowRadiusBo",
      "boltShaderCentralCoreNoiseScale", "boltShaderCentralCoreNoiseSpeed", "boltShaderCentralCoreIntensity",
      "boltShaderCentralCoreSoftness",
    ].forEach((key) => delete captured[key]);
    const haloBoltCountMin = Math.round(readNumber(els.tesla1HaloBoltCountMin, tesla1PresetDefault.haloBoltCountMin, 0, 256));
    return Object.freeze({
      ...captured,
      dominantBoltTargetRadiusBo: readNumber(els.tesla1MasterBoltContactRadiusBo, tesla1PresetDefault.dominantBoltTargetRadiusBo, 0, 8),
      haloBoltCountMin,
      haloBoltCountMax: Math.round(readNumber(els.tesla1HaloBoltCountMax, tesla1PresetDefault.haloBoltCountMax, haloBoltCountMin, 256)),
      lightningShapeNoiseScale: readNumber(els.tesla1LightningShapeNoiseScale, tesla1PresetDefault.lightningShapeNoiseScale, 0.1, 200),
      lightningShapeNoiseStrength: readNumber(els.tesla1LightningShapeNoiseStrength, tesla1PresetDefault.lightningShapeNoiseStrength, 0, 0.5),
      lightningShapeNoiseSpeed: readNumber(els.tesla1LightningShapeNoiseSpeed, tesla1PresetDefault.lightningShapeNoiseSpeed, 0, 20),
      haloFieldTargetMinRangeBo: readNumber(els.tesla1HaloTargetMinRangeBo, tesla1PresetDefault.haloFieldTargetMinRangeBo, 0, 32),
      haloFieldTargetMaxRangeBo: readNumber(els.tesla1HaloTargetMaxRangeBo, tesla1PresetDefault.haloFieldTargetMaxRangeBo, 0, 32),
      haloFieldContactRadiusBo: readNumber(els.tesla1HaloContactRadiusBo, tesla1PresetDefault.haloFieldContactRadiusBo, 0, 8),
      boltShaderLineWidthBo: readNumber(els.tesla1BoltShaderLineWidthBo, tesla1PresetDefault.boltShaderLineWidthBo, 0.001, 0.25),
      boltShaderIntensity: readNumber(els.tesla1BoltShaderIntensity, tesla1PresetDefault.boltShaderIntensity, 0, 20),
      boltShaderTipFade: readNumber(els.tesla1BoltShaderTipFade, tesla1PresetDefault.boltShaderTipFade, 0, 1),
      boltShaderFlickerSpeedHz: readNumber(els.tesla1BoltShaderFlickerSpeedHz, tesla1PresetDefault.boltShaderFlickerSpeedHz, 0, 60),
      boltShaderFlickerDepth: readNumber(els.tesla1BoltShaderFlickerDepth, tesla1PresetDefault.boltShaderFlickerDepth, 0, 1),
      boltShaderColorR: Math.round(readNumber(els.tesla1BoltShaderColorR, tesla1PresetDefault.boltShaderColorR, 0, 255)),
      boltShaderColorG: Math.round(readNumber(els.tesla1BoltShaderColorG, tesla1PresetDefault.boltShaderColorG, 0, 255)),
      boltShaderColorB: Math.round(readNumber(els.tesla1BoltShaderColorB, tesla1PresetDefault.boltShaderColorB, 0, 255)),
    });
  }

  function apply(els = {}, settings = null, options = {}) {
    const source = settings && typeof settings === "object" ? settings : defaultSettings();
    electricAdapter.apply(mapTeslaElsToElectric(els), source, options);
    if (els.tesla1MasterBoltContactRadiusBo) els.tesla1MasterBoltContactRadiusBo.value = String(source.dominantBoltTargetRadiusBo ?? 0.18);
    if (els.tesla1HaloTargetMinRangeBo) els.tesla1HaloTargetMinRangeBo.value = String(source.haloFieldTargetMinRangeBo ?? 0.5);
    if (els.tesla1HaloTargetMaxRangeBo) els.tesla1HaloTargetMaxRangeBo.value = String(source.haloFieldTargetMaxRangeBo ?? 2.1);
    if (els.tesla1HaloContactRadiusBo) els.tesla1HaloContactRadiusBo.value = String(source.haloFieldContactRadiusBo ?? 0.14);
    if (els.tesla1HaloBoltCountMin) els.tesla1HaloBoltCountMin.value = String(source.haloBoltCountMin ?? 4);
    if (els.tesla1HaloBoltCountMax) els.tesla1HaloBoltCountMax.value = String(source.haloBoltCountMax ?? 12);
    if (els.tesla1LightningShapeNoiseScale) els.tesla1LightningShapeNoiseScale.value = String(source.lightningShapeNoiseScale ?? 20);
    if (els.tesla1LightningShapeNoiseStrength) els.tesla1LightningShapeNoiseStrength.value = String(source.lightningShapeNoiseStrength ?? 0.03);
    if (els.tesla1LightningShapeNoiseSpeed) els.tesla1LightningShapeNoiseSpeed.value = String(source.lightningShapeNoiseSpeed ?? 3);
    if (els.tesla1BoltShaderLineWidthBo) els.tesla1BoltShaderLineWidthBo.value = String(source.boltShaderLineWidthBo ?? 0.012);
    if (els.tesla1BoltShaderIntensity) els.tesla1BoltShaderIntensity.value = String(source.boltShaderIntensity ?? 6);
    if (els.tesla1BoltShaderTipFade) els.tesla1BoltShaderTipFade.value = String(source.boltShaderTipFade ?? 0.08);
    if (els.tesla1BoltShaderFlickerSpeedHz) els.tesla1BoltShaderFlickerSpeedHz.value = String(source.boltShaderFlickerSpeedHz ?? 4);
    if (els.tesla1BoltShaderFlickerDepth) els.tesla1BoltShaderFlickerDepth.value = String(source.boltShaderFlickerDepth ?? 0.5);
    if (els.tesla1BoltShaderColorR) els.tesla1BoltShaderColorR.value = String(source.boltShaderColorR ?? 40);
    if (els.tesla1BoltShaderColorG) els.tesla1BoltShaderColorG.value = String(source.boltShaderColorG ?? 90);
    if (els.tesla1BoltShaderColorB) els.tesla1BoltShaderColorB.value = String(source.boltShaderColorB ?? 255);
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
