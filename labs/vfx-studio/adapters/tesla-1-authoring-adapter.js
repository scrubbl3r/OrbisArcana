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
      "haloFieldTargetMinRangeBo", "haloFieldTargetMaxRangeBo", "haloFieldContactRadiusBo",
      "haloFieldZMinBo", "haloFieldZMaxBo",
    ].forEach((key) => delete captured[key]);
    const haloBoltCountMin = Math.round(readNumber(els.tesla1HaloBoltCountMin, tesla1PresetDefault.haloBoltCountMin, 0, 256));
    const haloBoltTtlMinMs = Math.round(readNumber(els.tesla1HaloBoltTtlMinMs, tesla1PresetDefault.haloBoltTtlMinMs, 16, 10000));
    const haloBoltWanderSpeedMin = readNumber(els.tesla1HaloBoltWanderSpeedMin, tesla1PresetDefault.haloBoltWanderSpeedMin, 0, 4);
    const haloBoltRpscMin = readNumber(els.tesla1HaloBoltRpscMin, tesla1PresetDefault.haloBoltRpscMin, 0, 1);
    const haloBoltTurnTensionMin = readNumber(els.tesla1HaloBoltTurnTensionMin, tesla1PresetDefault.haloBoltTurnTensionMin, 0, 1);
    const haloBoltTurnDampingMin = readNumber(els.tesla1HaloBoltTurnDampingMin, tesla1PresetDefault.haloBoltTurnDampingMin, 0, 1);
    const fallbackShapeHz = tesla1PresetDefault.lightningShapeNoiseSpeed ?? 3;
    const lightningShapeNoiseSpeedMin = readNumber(els.tesla1LightningShapeNoiseSpeedMin, tesla1PresetDefault.lightningShapeNoiseSpeedMin ?? fallbackShapeHz, 0, 20);
    return Object.freeze({
      ...captured,
      dominantBoltTargetRadiusBo: readNumber(els.tesla1MasterBoltContactRadiusBo, tesla1PresetDefault.dominantBoltTargetRadiusBo, 0, 8),
      haloBoltCountMin,
      haloBoltCountMax: Math.round(readNumber(els.tesla1HaloBoltCountMax, tesla1PresetDefault.haloBoltCountMax, haloBoltCountMin, 256)),
      haloBoltTtlMinMs,
      haloBoltTtlMaxMs: Math.round(readNumber(els.tesla1HaloBoltTtlMaxMs, tesla1PresetDefault.haloBoltTtlMaxMs, haloBoltTtlMinMs, 10000)),
      haloBoltWanderSpeedMin,
      haloBoltWanderSpeedMax: readNumber(els.tesla1HaloBoltWanderSpeedMax, tesla1PresetDefault.haloBoltWanderSpeedMax, haloBoltWanderSpeedMin, 4),
      haloBoltRpscMin,
      haloBoltRpscMax: readNumber(els.tesla1HaloBoltRpscMax, tesla1PresetDefault.haloBoltRpscMax, haloBoltRpscMin, 1),
      haloBoltTurnTensionMin,
      haloBoltTurnTensionMax: readNumber(els.tesla1HaloBoltTurnTensionMax, tesla1PresetDefault.haloBoltTurnTensionMax, haloBoltTurnTensionMin, 1),
      haloBoltTurnDampingMin,
      haloBoltTurnDampingMax: readNumber(els.tesla1HaloBoltTurnDampingMax, tesla1PresetDefault.haloBoltTurnDampingMax, haloBoltTurnDampingMin, 1),
      haloBoltDispersion: readNumber(els.tesla1HaloBoltDispersion, tesla1PresetDefault.haloBoltDispersion, 0, 1),
      lightningShapeMacroNoiseScale: readNumber(els.tesla1LightningShapeMacroNoiseScale, tesla1PresetDefault.lightningShapeMacroNoiseScale ?? tesla1PresetDefault.lightningShapeNoiseScale, 0.1, 200),
      lightningShapeMacroNoiseStrength: readNumber(els.tesla1LightningShapeMacroNoiseStrength, tesla1PresetDefault.lightningShapeMacroNoiseStrength ?? tesla1PresetDefault.lightningShapeNoiseStrength, 0, 0.5),
      lightningShapeMicroNoiseScale: readNumber(els.tesla1LightningShapeMicroNoiseScale, tesla1PresetDefault.lightningShapeMicroNoiseScale, 0.1, 300),
      lightningShapeMicroNoiseStrength: readNumber(els.tesla1LightningShapeMicroNoiseStrength, tesla1PresetDefault.lightningShapeMicroNoiseStrength, 0, 0.5),
      lightningShapeNoiseSpeedMin,
      lightningShapeNoiseSpeedMax: readNumber(els.tesla1LightningShapeNoiseSpeedMax, tesla1PresetDefault.lightningShapeNoiseSpeedMax ?? fallbackShapeHz, lightningShapeNoiseSpeedMin, 20),
      lightningShapeBranchDensity: readNumber(els.tesla1LightningShapeBranchDensity, tesla1PresetDefault.lightningShapeBranchDensity, 0, 1),
      lightningShapeBranchLengthMinBo: readNumber(els.tesla1LightningShapeBranchLengthMinBo, tesla1PresetDefault.lightningShapeBranchLengthMinBo, 0, 8),
      lightningShapeBranchLengthMaxBo: readNumber(els.tesla1LightningShapeBranchLengthMaxBo, tesla1PresetDefault.lightningShapeBranchLengthMaxBo, 0, 8),
      lightningShapeBranchAngleMinDeg: readNumber(els.tesla1LightningShapeBranchAngleMinDeg, tesla1PresetDefault.lightningShapeBranchAngleMinDeg, 0, 170),
      lightningShapeBranchAngleMaxDeg: readNumber(els.tesla1LightningShapeBranchAngleMaxDeg, tesla1PresetDefault.lightningShapeBranchAngleMaxDeg, 0, 170),
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
    if (els.tesla1HaloBoltCountMin) els.tesla1HaloBoltCountMin.value = String(source.haloBoltCountMin ?? 4);
    if (els.tesla1HaloBoltCountMax) els.tesla1HaloBoltCountMax.value = String(source.haloBoltCountMax ?? 12);
    if (els.tesla1HaloBoltTtlMinMs) els.tesla1HaloBoltTtlMinMs.value = String(source.haloBoltTtlMinMs ?? 350);
    if (els.tesla1HaloBoltTtlMaxMs) els.tesla1HaloBoltTtlMaxMs.value = String(source.haloBoltTtlMaxMs ?? 900);
    if (els.tesla1HaloBoltWanderSpeedMin) els.tesla1HaloBoltWanderSpeedMin.value = String(source.haloBoltWanderSpeedMin ?? 0.05);
    if (els.tesla1HaloBoltWanderSpeedMax) els.tesla1HaloBoltWanderSpeedMax.value = String(source.haloBoltWanderSpeedMax ?? 0.18);
    if (els.tesla1HaloBoltRpscMin) els.tesla1HaloBoltRpscMin.value = String(source.haloBoltRpscMin ?? 0.08);
    if (els.tesla1HaloBoltRpscMax) els.tesla1HaloBoltRpscMax.value = String(source.haloBoltRpscMax ?? 0.24);
    if (els.tesla1HaloBoltTurnTensionMin) els.tesla1HaloBoltTurnTensionMin.value = String(source.haloBoltTurnTensionMin ?? 0.22);
    if (els.tesla1HaloBoltTurnTensionMax) els.tesla1HaloBoltTurnTensionMax.value = String(source.haloBoltTurnTensionMax ?? 0.55);
    if (els.tesla1HaloBoltTurnDampingMin) els.tesla1HaloBoltTurnDampingMin.value = String(source.haloBoltTurnDampingMin ?? 0.04);
    if (els.tesla1HaloBoltTurnDampingMax) els.tesla1HaloBoltTurnDampingMax.value = String(source.haloBoltTurnDampingMax ?? 0.18);
    if (els.tesla1HaloBoltDispersion) els.tesla1HaloBoltDispersion.value = String(source.haloBoltDispersion ?? 0.2);
    if (els.tesla1LightningShapeMacroNoiseScale) els.tesla1LightningShapeMacroNoiseScale.value = String(source.lightningShapeMacroNoiseScale ?? source.lightningShapeNoiseScale ?? 7);
    if (els.tesla1LightningShapeMacroNoiseStrength) els.tesla1LightningShapeMacroNoiseStrength.value = String(source.lightningShapeMacroNoiseStrength ?? source.lightningShapeNoiseStrength ?? 0.15);
    if (els.tesla1LightningShapeMicroNoiseScale) els.tesla1LightningShapeMicroNoiseScale.value = String(source.lightningShapeMicroNoiseScale ?? 42);
    if (els.tesla1LightningShapeMicroNoiseStrength) els.tesla1LightningShapeMicroNoiseStrength.value = String(source.lightningShapeMicroNoiseStrength ?? 0.025);
    if (els.tesla1LightningShapeNoiseSpeedMin) els.tesla1LightningShapeNoiseSpeedMin.value = String(source.lightningShapeNoiseSpeedMin ?? source.lightningShapeNoiseSpeed ?? 3);
    if (els.tesla1LightningShapeNoiseSpeedMax) els.tesla1LightningShapeNoiseSpeedMax.value = String(source.lightningShapeNoiseSpeedMax ?? source.lightningShapeNoiseSpeed ?? 3);
    if (els.tesla1LightningShapeBranchDensity) els.tesla1LightningShapeBranchDensity.value = String(source.lightningShapeBranchDensity ?? 0);
    if (els.tesla1LightningShapeBranchLengthMinBo) els.tesla1LightningShapeBranchLengthMinBo.value = String(source.lightningShapeBranchLengthMinBo ?? 0.06);
    if (els.tesla1LightningShapeBranchLengthMaxBo) els.tesla1LightningShapeBranchLengthMaxBo.value = String(source.lightningShapeBranchLengthMaxBo ?? 0.22);
    if (els.tesla1LightningShapeBranchAngleMinDeg) els.tesla1LightningShapeBranchAngleMinDeg.value = String(source.lightningShapeBranchAngleMinDeg ?? 35);
    if (els.tesla1LightningShapeBranchAngleMaxDeg) els.tesla1LightningShapeBranchAngleMaxDeg.value = String(source.lightningShapeBranchAngleMaxDeg ?? 80);
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
