import { TESLA_1_PRESET_DEFAULT } from "../../../src/vfx/presets/tesla-1-default.js";
import { createElectricAoe3dAuthoringAdapter } from "./electric-aoe-3d-authoring-adapter.js?v=20260522-softness-a";

const TESLA_TO_ELECTRIC_ELEMENT_KEYS = Object.freeze({
  tesla1BoltShaderEnabled: "electricAoe3dBoltShaderEnabled",
  tesla1BoltShaderCoreWidthMinBo: "electricAoe3dBoltShaderCoreWidthMinBo",
  tesla1BoltShaderCoreWidthMaxBo: "electricAoe3dBoltShaderCoreWidthMaxBo",
  tesla1BoltShaderGlowWidthMinBo: "electricAoe3dBoltShaderGlowWidthMinBo",
  tesla1BoltShaderGlowWidthMaxBo: "electricAoe3dBoltShaderGlowWidthMaxBo",
  tesla1BoltShaderLengthTaper: "electricAoe3dBoltShaderLengthTaper",
  tesla1BoltShaderTipOpacity: "electricAoe3dBoltShaderTipOpacity",
  tesla1BoltShaderCoreIntensity: "electricAoe3dBoltShaderCoreIntensity",
  tesla1BoltShaderCoreSoftness: "electricAoe3dBoltShaderCoreSoftness",
  tesla1BoltShaderGlowIntensity: "electricAoe3dBoltShaderGlowIntensity",
  tesla1BoltShaderGlowSoftness: "electricAoe3dBoltShaderGlowSoftness",
  tesla1BoltShaderFlickerSpeedHz: "electricAoe3dBoltShaderFlickerSpeedHz",
  tesla1BoltShaderFlickerDepth: "electricAoe3dBoltShaderFlickerDepth",
  tesla1BoltShaderCoreR: "electricAoe3dBoltShaderCoreR",
  tesla1BoltShaderCoreG: "electricAoe3dBoltShaderCoreG",
  tesla1BoltShaderCoreB: "electricAoe3dBoltShaderCoreB",
  tesla1BoltShaderGlowR: "electricAoe3dBoltShaderGlowR",
  tesla1BoltShaderGlowG: "electricAoe3dBoltShaderGlowG",
  tesla1BoltShaderGlowB: "electricAoe3dBoltShaderGlowB",
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

function readBoolean(el, fallback = true) {
  if (!el) return !!fallback;
  return !!el.checked;
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
    const captured = electricAdapter.capture(mappedEls);
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
      boltShaderCoreA: readNumber(els.tesla1BoltShaderCoreA, tesla1PresetDefault.boltShaderCoreA, 0, 1),
      boltShaderGlowA: readNumber(els.tesla1BoltShaderGlowA, tesla1PresetDefault.boltShaderGlowA, 0, 1),
      boltShaderCentralCoreEnabled: readBoolean(els.tesla1BoltShaderCentralCoreEnabled, tesla1PresetDefault.boltShaderCentralCoreEnabled),
      boltShaderCentralCoreRadiusBo: readNumber(els.tesla1BoltShaderCentralCoreRadiusBo, tesla1PresetDefault.boltShaderCentralCoreRadiusBo, 0, 8),
      boltShaderCentralCoreGlowRadiusBo: readNumber(els.tesla1BoltShaderCentralCoreGlowRadiusBo, tesla1PresetDefault.boltShaderCentralCoreGlowRadiusBo, 0, 8),
      boltShaderCentralCoreNoiseScale: readNumber(els.tesla1BoltShaderCentralCoreNoiseScale, tesla1PresetDefault.boltShaderCentralCoreNoiseScale, 0, 200),
      boltShaderCentralCoreNoiseSpeed: readNumber(els.tesla1BoltShaderCentralCoreNoiseSpeed, tesla1PresetDefault.boltShaderCentralCoreNoiseSpeed, 0, 60),
      boltShaderCentralCoreIntensity: readNumber(els.tesla1BoltShaderCentralCoreIntensity, tesla1PresetDefault.boltShaderCentralCoreIntensity, 0, 20),
      boltShaderCentralCoreSoftness: readNumber(els.tesla1BoltShaderCentralCoreSoftness, tesla1PresetDefault.boltShaderCentralCoreSoftness, 0, 1),
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
    if (els.tesla1BoltShaderCoreA) els.tesla1BoltShaderCoreA.value = String(source.boltShaderCoreA ?? 1);
    if (els.tesla1BoltShaderGlowA) els.tesla1BoltShaderGlowA.value = String(source.boltShaderGlowA ?? 1);
    if (els.tesla1BoltShaderCentralCoreEnabled) els.tesla1BoltShaderCentralCoreEnabled.checked = source.boltShaderCentralCoreEnabled !== false;
    if (els.tesla1BoltShaderCentralCoreRadiusBo) els.tesla1BoltShaderCentralCoreRadiusBo.value = String(source.boltShaderCentralCoreRadiusBo ?? 0.42);
    if (els.tesla1BoltShaderCentralCoreGlowRadiusBo) els.tesla1BoltShaderCentralCoreGlowRadiusBo.value = String(source.boltShaderCentralCoreGlowRadiusBo ?? 0.65);
    if (els.tesla1BoltShaderCentralCoreNoiseScale) els.tesla1BoltShaderCentralCoreNoiseScale.value = String(source.boltShaderCentralCoreNoiseScale ?? 36);
    if (els.tesla1BoltShaderCentralCoreNoiseSpeed) els.tesla1BoltShaderCentralCoreNoiseSpeed.value = String(source.boltShaderCentralCoreNoiseSpeed ?? 5);
    if (els.tesla1BoltShaderCentralCoreIntensity) els.tesla1BoltShaderCentralCoreIntensity.value = String(source.boltShaderCentralCoreIntensity ?? 3.6);
    if (els.tesla1BoltShaderCentralCoreSoftness) els.tesla1BoltShaderCentralCoreSoftness.value = String(source.boltShaderCentralCoreSoftness ?? 0.55);
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
  });
}
