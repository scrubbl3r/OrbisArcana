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
    const treeBoltCountMin = Math.round(readNumber(els.tesla1LightningTreeBoltCountMin, tesla1PresetDefault.lightningTreeBoltCountMin, 0, 256));
    const treeFrequencyMinMs = Math.round(readNumber(els.tesla1LightningTreeFrequencyMinMs, tesla1PresetDefault.lightningTreeFrequencyMinMs, 16, 60000));
    const treeTtlMinMs = Math.round(readNumber(els.tesla1LightningTreeTtlMinMs, tesla1PresetDefault.lightningTreeTtlMinMs, 16, 20000));
    const branchLengthMinBo = readNumber(els.tesla1LightningTreeBranchLengthMinBo, tesla1PresetDefault.lightningTreeBranchLengthMinBo, 0, 8);
    return Object.freeze({
      ...captured,
      dominantBoltTargetRadiusBo: readNumber(els.tesla1MasterBoltContactRadiusBo, tesla1PresetDefault.dominantBoltTargetRadiusBo, 0, 8),
      lightningTreeBoltCountMin: treeBoltCountMin,
      lightningTreeBoltCountMax: Math.round(readNumber(els.tesla1LightningTreeBoltCountMax, tesla1PresetDefault.lightningTreeBoltCountMax, treeBoltCountMin, 256)),
      lightningTreeFrequencyMinMs: treeFrequencyMinMs,
      lightningTreeFrequencyMaxMs: Math.round(readNumber(els.tesla1LightningTreeFrequencyMaxMs, tesla1PresetDefault.lightningTreeFrequencyMaxMs, treeFrequencyMinMs, 60000)),
      lightningTreeTtlMinMs: treeTtlMinMs,
      lightningTreeTtlMaxMs: Math.round(readNumber(els.tesla1LightningTreeTtlMaxMs, tesla1PresetDefault.lightningTreeTtlMaxMs, treeTtlMinMs, 20000)),
      lightningTreeSubdivisions: Math.round(readNumber(els.tesla1LightningTreeSubdivisions, tesla1PresetDefault.lightningTreeSubdivisions, 0, 10)),
      lightningTreeDisplacementBo: readNumber(els.tesla1LightningTreeDisplacementBo, tesla1PresetDefault.lightningTreeDisplacementBo, 0, 8),
      lightningTreeDisplacementDecay: readNumber(els.tesla1LightningTreeDisplacementDecay, tesla1PresetDefault.lightningTreeDisplacementDecay, 0, 1),
      lightningTreeSmoothing: readNumber(els.tesla1LightningTreeSmoothing, tesla1PresetDefault.lightningTreeSmoothing, 0, 1),
      lightningTreeNoiseSpeedHz: readNumber(els.tesla1LightningTreeNoiseSpeedHz, tesla1PresetDefault.lightningTreeNoiseSpeedHz, 0, 120),
      lightningTreeForkChance: readNumber(els.tesla1LightningTreeForkChance, tesla1PresetDefault.lightningTreeForkChance, 0, 1),
      lightningTreeForkDepth: Math.round(readNumber(els.tesla1LightningTreeForkDepth, tesla1PresetDefault.lightningTreeForkDepth, 0, 4)),
      lightningTreeBranchChance: readNumber(els.tesla1LightningTreeBranchChance, tesla1PresetDefault.lightningTreeBranchChance, 0, 1),
      lightningTreeBranchLengthMinBo: branchLengthMinBo,
      lightningTreeBranchLengthMaxBo: readNumber(els.tesla1LightningTreeBranchLengthMaxBo, tesla1PresetDefault.lightningTreeBranchLengthMaxBo, branchLengthMinBo, 8),
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
    if (els.tesla1LightningTreeBoltCountMin) els.tesla1LightningTreeBoltCountMin.value = String(source.lightningTreeBoltCountMin ?? 4);
    if (els.tesla1LightningTreeBoltCountMax) els.tesla1LightningTreeBoltCountMax.value = String(source.lightningTreeBoltCountMax ?? 12);
    if (els.tesla1LightningTreeFrequencyMinMs) els.tesla1LightningTreeFrequencyMinMs.value = String(source.lightningTreeFrequencyMinMs ?? 90);
    if (els.tesla1LightningTreeFrequencyMaxMs) els.tesla1LightningTreeFrequencyMaxMs.value = String(source.lightningTreeFrequencyMaxMs ?? 260);
    if (els.tesla1LightningTreeTtlMinMs) els.tesla1LightningTreeTtlMinMs.value = String(source.lightningTreeTtlMinMs ?? 120);
    if (els.tesla1LightningTreeTtlMaxMs) els.tesla1LightningTreeTtlMaxMs.value = String(source.lightningTreeTtlMaxMs ?? 420);
    if (els.tesla1LightningTreeSubdivisions) els.tesla1LightningTreeSubdivisions.value = String(source.lightningTreeSubdivisions ?? 5);
    if (els.tesla1LightningTreeDisplacementBo) els.tesla1LightningTreeDisplacementBo.value = String(source.lightningTreeDisplacementBo ?? 0.22);
    if (els.tesla1LightningTreeDisplacementDecay) els.tesla1LightningTreeDisplacementDecay.value = String(source.lightningTreeDisplacementDecay ?? 0.58);
    if (els.tesla1LightningTreeSmoothing) els.tesla1LightningTreeSmoothing.value = String(source.lightningTreeSmoothing ?? 0.22);
    if (els.tesla1LightningTreeNoiseSpeedHz) els.tesla1LightningTreeNoiseSpeedHz.value = String(source.lightningTreeNoiseSpeedHz ?? 18);
    if (els.tesla1LightningTreeForkChance) els.tesla1LightningTreeForkChance.value = String(source.lightningTreeForkChance ?? 0.15);
    if (els.tesla1LightningTreeForkDepth) els.tesla1LightningTreeForkDepth.value = String(source.lightningTreeForkDepth ?? 1);
    if (els.tesla1LightningTreeBranchChance) els.tesla1LightningTreeBranchChance.value = String(source.lightningTreeBranchChance ?? 0.18);
    if (els.tesla1LightningTreeBranchLengthMinBo) els.tesla1LightningTreeBranchLengthMinBo.value = String(source.lightningTreeBranchLengthMinBo ?? 0.08);
    if (els.tesla1LightningTreeBranchLengthMaxBo) els.tesla1LightningTreeBranchLengthMaxBo.value = String(source.lightningTreeBranchLengthMaxBo ?? 0.32);
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
