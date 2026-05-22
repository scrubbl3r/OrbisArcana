import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../../../src/vfx/presets/electric-aoe-3d-default.js?v=20260521-halo-field-a";
import { ELECTRIC_AOE_BEHAVIOR_DEFAULT } from "../../../src/game-runtime/behaviors/electric-aoe-behavior-default.js?v=20260521-electric-damage-b";

export function createElectricAoe3dAuthoringAdapter({
  electricAoe3dPresetDefault = ELECTRIC_AOE_3D_PRESET_DEFAULT,
  electricAoe3dBehaviorDefault = ELECTRIC_AOE_BEHAVIOR_DEFAULT,
} = {}) {
  function readNumber(el, fallback, min = -Infinity, max = Infinity) {
    const numeric = Number(el && el.value);
    const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
    return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
  }

  function readBoolean(el, fallback = true) {
    if (!el) return !!fallback;
    return !!el.checked;
  }

  function defaultSettings() {
    return {
      ...electricAoe3dPresetDefault,
      ...electricAoe3dBehaviorDefault,
    };
  }

  function capture(els = {}) {
    const defaults = defaultSettings();
    const spellDurationMs = Math.round(readNumber(els.electricAoe3dSpellDurationMs, defaults.spellDurationMs ?? defaults.durationMs, 200, 60000));
    const minRange = readNumber(
      els.electricAoe3dDominantBoltMinRangeBo,
      defaults.dominantBoltMinRangeBo,
      0,
      64
    );
    const maxRange = readNumber(
      els.electricAoe3dDominantBoltMaxRangeBo,
      defaults.dominantBoltMaxRangeBo ?? defaults.dominantBoltRangeBo,
      Math.max(0.25, minRange),
      64
    );
    const enemyMinRange = readNumber(
      els.electricAoe3dDominantBoltEnemyMinRangeBo,
      defaults.dominantBoltEnemyMinRangeBo,
      0,
      64
    );
    const enemyMaxRange = readNumber(
      els.electricAoe3dDominantBoltEnemyMaxRangeBo,
      defaults.dominantBoltEnemyMaxRangeBo,
      Math.max(0.25, enemyMinRange),
      64
    );
    const envFrequencyMinMs = Math.round(readNumber(
      els.electricAoe3dDominantBoltEnvironmentFrequencyMinMs,
      defaults.dominantBoltEnvironmentFrequencyMinMs,
      16,
      60000
    ));
    const envFrequencyMaxMs = Math.round(readNumber(
      els.electricAoe3dDominantBoltEnvironmentFrequencyMaxMs,
      defaults.dominantBoltEnvironmentFrequencyMaxMs,
      envFrequencyMinMs,
      60000
    ));
    const enemyFrequencyMinMs = Math.round(readNumber(
      els.electricAoe3dDominantBoltEnemyFrequencyMinMs,
      defaults.dominantBoltEnemyFrequencyMinMs,
      16,
      60000
    ));
    const enemyFrequencyMaxMs = Math.round(readNumber(
      els.electricAoe3dDominantBoltEnemyFrequencyMaxMs,
      defaults.dominantBoltEnemyFrequencyMaxMs,
      enemyFrequencyMinMs,
      60000
    ));
    const damageMin = readNumber(
      els.electricAoe3dDominantBoltDamageMin,
      defaults.dominantBoltDamageMin,
      0,
      10000
    );
    const damageMax = readNumber(
      els.electricAoe3dDominantBoltDamageMax,
      defaults.dominantBoltDamageMax,
      damageMin,
      10000
    );
    const minStep = readNumber(
      els.electricAoe3dDominantBoltMinStepBo,
      defaults.dominantBoltMinStepBo,
      0.05,
      8
    );
    const maxStep = readNumber(
      els.electricAoe3dDominantBoltMaxStepBo,
      defaults.dominantBoltMaxStepBo,
      minStep,
      8
    );
    const haloMinRange = readNumber(els.electricAoe3dHaloBoltMinRangeBo, defaults.haloBoltMinRangeBo, 0, 16);
    const haloMaxRange = readNumber(els.electricAoe3dHaloBoltMaxRangeBo, defaults.haloBoltMaxRangeBo, Math.max(0.05, haloMinRange), 16);
    const haloMinTotal = Math.round(readNumber(els.electricAoe3dHaloBoltMinTotal, defaults.haloBoltMinTotal, 0, 64));
    const haloMaxTotal = Math.round(readNumber(els.electricAoe3dHaloBoltMaxTotal, defaults.haloBoltMaxTotal, haloMinTotal, 64));
    const haloMinWalkSpeed = readNumber(els.electricAoe3dHaloBoltMinWalkSpeed, defaults.haloBoltMinWalkSpeed, 0, 12);
    const haloMaxWalkSpeed = readNumber(els.electricAoe3dHaloBoltMaxWalkSpeed, defaults.haloBoltMaxWalkSpeed, haloMinWalkSpeed, 12);
    const haloMinStep = readNumber(els.electricAoe3dHaloBoltMinStepBo, defaults.haloBoltMinStepBo, 0.01, 4);
    const haloMaxStep = readNumber(els.electricAoe3dHaloBoltMaxStepBo, defaults.haloBoltMaxStepBo, haloMinStep, 4);
    const haloForksMin = Math.round(readNumber(els.electricAoe3dHaloBoltForksMin, defaults.haloBoltForksMin, 0, 12));
    const haloForksMax = Math.round(readNumber(els.electricAoe3dHaloBoltForksMax, defaults.haloBoltForksMax, haloForksMin, 12));
    const haloForkLengthMin = readNumber(els.electricAoe3dHaloBoltForkLengthMinBo, defaults.haloBoltForkLengthMinBo, 0, 8);
    const haloForkLengthMax = readNumber(els.electricAoe3dHaloBoltForkLengthMaxBo, defaults.haloBoltForkLengthMaxBo, haloForkLengthMin, 8);
    const haloFieldMinFeaturePoints = Math.round(readNumber(els.electricAoe3dHaloFieldMinFeaturePoints, defaults.haloFieldMinFeaturePoints, 0, 64));
    const haloFieldMaxFeaturePoints = Math.round(readNumber(els.electricAoe3dHaloFieldMaxFeaturePoints, defaults.haloFieldMaxFeaturePoints, haloFieldMinFeaturePoints, 64));
    const haloFieldMinDriftSpeed = readNumber(els.electricAoe3dHaloFieldMinDriftSpeed, defaults.haloFieldMinDriftSpeed, 0, 12);
    const haloFieldMaxDriftSpeed = readNumber(els.electricAoe3dHaloFieldMaxDriftSpeed, defaults.haloFieldMaxDriftSpeed, haloFieldMinDriftSpeed, 12);
    const haloFieldMinDifferentialOffset = readNumber(els.electricAoe3dHaloFieldMinDifferentialOffset, defaults.haloFieldMinDifferentialOffset, 0, 1);
    const haloFieldMaxDifferentialOffset = readNumber(els.electricAoe3dHaloFieldMaxDifferentialOffset, defaults.haloFieldMaxDifferentialOffset, haloFieldMinDifferentialOffset, 1);
    return Object.freeze({
      ...defaults,
      durationMs: spellDurationMs,
      spellDurationMs,
      dominantBoltDamageMin: damageMin,
      dominantBoltDamageMax: damageMax,
      dominantBoltDetourRatioMax: readNumber(els.electricAoe3dDominantBoltDetourRatioMax, defaults.dominantBoltDetourRatioMax, 1, 8),
      dominantBoltEnemyFrequencyMinMs: enemyFrequencyMinMs,
      dominantBoltEnemyFrequencyMaxMs: enemyFrequencyMaxMs,
      dominantBoltEnemyMinRangeBo: enemyMinRange,
      dominantBoltEnemyMaxRangeBo: enemyMaxRange,
      dominantBoltEnvironmentFrequencyMinMs: envFrequencyMinMs,
      dominantBoltEnvironmentFrequencyMaxMs: envFrequencyMaxMs,
      dominantBoltHeadingMemory: readNumber(els.electricAoe3dDominantBoltHeadingMemory, defaults.dominantBoltHeadingMemory, 0, 1),
      dominantBoltMinRangeBo: minRange,
      dominantBoltMaxRangeBo: maxRange,
      dominantBoltMinStepBo: minStep,
      dominantBoltMaxStepBo: maxStep,
      dominantBoltPathJitterBo: readNumber(els.electricAoe3dDominantBoltPathJitterBo, defaults.dominantBoltPathJitterBo, 0, 2),
      dominantBoltRangeBo: maxRange,
      dominantBoltSeekStrength: readNumber(els.electricAoe3dDominantBoltSeekStrength, defaults.dominantBoltSeekStrength, 0, 4),
      dominantBoltWanderStrength: readNumber(els.electricAoe3dDominantBoltWanderStrength, defaults.dominantBoltWanderStrength, 0, 4),
      haloBoltForkLengthMaxBo: haloForkLengthMax,
      haloBoltForkLengthMinBo: haloForkLengthMin,
      haloBoltForksMax: haloForksMax,
      haloBoltForksMin: haloForksMin,
      haloBoltMaxRangeBo: haloMaxRange,
      haloBoltMaxStepBo: haloMaxStep,
      haloBoltMaxTotal: haloMaxTotal,
      haloBoltMaxWalkSpeed: haloMaxWalkSpeed,
      haloBoltMinRangeBo: haloMinRange,
      haloBoltMinStepBo: haloMinStep,
      haloBoltMinTotal: haloMinTotal,
      haloBoltMinWalkSpeed: haloMinWalkSpeed,
      haloBoltPathJitterBo: readNumber(els.electricAoe3dHaloBoltPathJitterBo, defaults.haloBoltPathJitterBo, 0, 2),
      haloFieldCellJitter: readNumber(els.electricAoe3dHaloFieldCellJitter, defaults.haloFieldCellJitter, 0, 1),
      haloFieldEnabled: readBoolean(els.electricAoe3dHaloFieldEnabled, defaults.haloFieldEnabled),
      haloFieldMaxDifferentialOffset,
      haloFieldMaxDriftSpeed,
      haloFieldMaxFeaturePoints,
      haloFieldMinDifferentialOffset,
      haloFieldMinDriftSpeed,
      haloFieldMinFeaturePoints,
      haloFieldSeed: Math.round(readNumber(els.electricAoe3dHaloFieldSeed, defaults.haloFieldSeed, 1, 999999999)),
      haloFieldSliceWidthBo: readNumber(els.electricAoe3dHaloFieldSliceWidthBo, defaults.haloFieldSliceWidthBo, 0, 2),
    });
  }

  function apply(els = {}, settings = null, { applyPreview = null } = {}) {
    const source = settings && typeof settings === "object" ? settings : defaultSettings();
    if (els.electricAoe3dSpellDurationMs) {
      els.electricAoe3dSpellDurationMs.value = String(source.spellDurationMs ?? source.durationMs ?? 10000);
    }
    if (els.electricAoe3dDominantBoltMinRangeBo) {
      els.electricAoe3dDominantBoltMinRangeBo.value = String(source.dominantBoltMinRangeBo ?? source.dominantBoltRangeBo ?? 4);
    }
    if (els.electricAoe3dDominantBoltMaxRangeBo) {
      els.electricAoe3dDominantBoltMaxRangeBo.value = String(source.dominantBoltMaxRangeBo ?? source.dominantBoltRangeBo ?? 7);
    }
    if (els.electricAoe3dDominantBoltEnemyMinRangeBo) {
      els.electricAoe3dDominantBoltEnemyMinRangeBo.value = String(source.dominantBoltEnemyMinRangeBo ?? 1);
    }
    if (els.electricAoe3dDominantBoltEnemyMaxRangeBo) {
      els.electricAoe3dDominantBoltEnemyMaxRangeBo.value = String(source.dominantBoltEnemyMaxRangeBo ?? 9);
    }
    if (els.electricAoe3dDominantBoltEnvironmentFrequencyMinMs) {
      els.electricAoe3dDominantBoltEnvironmentFrequencyMinMs.value = String(source.dominantBoltEnvironmentFrequencyMinMs ?? 700);
    }
    if (els.electricAoe3dDominantBoltEnvironmentFrequencyMaxMs) {
      els.electricAoe3dDominantBoltEnvironmentFrequencyMaxMs.value = String(source.dominantBoltEnvironmentFrequencyMaxMs ?? 1800);
    }
    if (els.electricAoe3dDominantBoltEnemyFrequencyMinMs) {
      els.electricAoe3dDominantBoltEnemyFrequencyMinMs.value = String(source.dominantBoltEnemyFrequencyMinMs ?? 450);
    }
    if (els.electricAoe3dDominantBoltEnemyFrequencyMaxMs) {
      els.electricAoe3dDominantBoltEnemyFrequencyMaxMs.value = String(source.dominantBoltEnemyFrequencyMaxMs ?? 1200);
    }
    if (els.electricAoe3dDominantBoltDamageMin) {
      els.electricAoe3dDominantBoltDamageMin.value = String(source.dominantBoltDamageMin ?? 0.1);
    }
    if (els.electricAoe3dDominantBoltDamageMax) {
      els.electricAoe3dDominantBoltDamageMax.value = String(source.dominantBoltDamageMax ?? 0.3);
    }
    if (els.electricAoe3dDominantBoltDetourRatioMax) {
      els.electricAoe3dDominantBoltDetourRatioMax.value = String(source.dominantBoltDetourRatioMax ?? 1.4);
    }
    if (els.electricAoe3dDominantBoltMinStepBo) {
      els.electricAoe3dDominantBoltMinStepBo.value = String(source.dominantBoltMinStepBo ?? 0.35);
    }
    if (els.electricAoe3dDominantBoltMaxStepBo) {
      els.electricAoe3dDominantBoltMaxStepBo.value = String(source.dominantBoltMaxStepBo ?? 0.9);
    }
    if (els.electricAoe3dDominantBoltSeekStrength) {
      els.electricAoe3dDominantBoltSeekStrength.value = String(source.dominantBoltSeekStrength ?? 0.42);
    }
    if (els.electricAoe3dDominantBoltHeadingMemory) {
      els.electricAoe3dDominantBoltHeadingMemory.value = String(source.dominantBoltHeadingMemory ?? 0.72);
    }
    if (els.electricAoe3dDominantBoltWanderStrength) {
      els.electricAoe3dDominantBoltWanderStrength.value = String(source.dominantBoltWanderStrength ?? 0.9);
    }
    if (els.electricAoe3dDominantBoltPathJitterBo) {
      els.electricAoe3dDominantBoltPathJitterBo.value = String(source.dominantBoltPathJitterBo ?? 0.18);
    }
    if (els.electricAoe3dHaloBoltMinRangeBo) {
      els.electricAoe3dHaloBoltMinRangeBo.value = String(source.haloBoltMinRangeBo ?? 0.55);
    }
    if (els.electricAoe3dHaloBoltMaxRangeBo) {
      els.electricAoe3dHaloBoltMaxRangeBo.value = String(source.haloBoltMaxRangeBo ?? 1.65);
    }
    if (els.electricAoe3dHaloBoltMinTotal) {
      els.electricAoe3dHaloBoltMinTotal.value = String(source.haloBoltMinTotal ?? 4);
    }
    if (els.electricAoe3dHaloBoltMaxTotal) {
      els.electricAoe3dHaloBoltMaxTotal.value = String(source.haloBoltMaxTotal ?? 10);
    }
    if (els.electricAoe3dHaloBoltMinWalkSpeed) {
      els.electricAoe3dHaloBoltMinWalkSpeed.value = String(source.haloBoltMinWalkSpeed ?? 0.35);
    }
    if (els.electricAoe3dHaloBoltMaxWalkSpeed) {
      els.electricAoe3dHaloBoltMaxWalkSpeed.value = String(source.haloBoltMaxWalkSpeed ?? 1.2);
    }
    if (els.electricAoe3dHaloBoltMinStepBo) {
      els.electricAoe3dHaloBoltMinStepBo.value = String(source.haloBoltMinStepBo ?? 0.08);
    }
    if (els.electricAoe3dHaloBoltMaxStepBo) {
      els.electricAoe3dHaloBoltMaxStepBo.value = String(source.haloBoltMaxStepBo ?? 0.28);
    }
    if (els.electricAoe3dHaloBoltPathJitterBo) {
      els.electricAoe3dHaloBoltPathJitterBo.value = String(source.haloBoltPathJitterBo ?? 0.16);
    }
    if (els.electricAoe3dHaloBoltForksMin) {
      els.electricAoe3dHaloBoltForksMin.value = String(source.haloBoltForksMin ?? 0);
    }
    if (els.electricAoe3dHaloBoltForksMax) {
      els.electricAoe3dHaloBoltForksMax.value = String(source.haloBoltForksMax ?? 2);
    }
    if (els.electricAoe3dHaloBoltForkLengthMinBo) {
      els.electricAoe3dHaloBoltForkLengthMinBo.value = String(source.haloBoltForkLengthMinBo ?? 0.2);
    }
    if (els.electricAoe3dHaloBoltForkLengthMaxBo) {
      els.electricAoe3dHaloBoltForkLengthMaxBo.value = String(source.haloBoltForkLengthMaxBo ?? 0.7);
    }
    if (els.electricAoe3dHaloFieldEnabled) {
      els.electricAoe3dHaloFieldEnabled.checked = source.haloFieldEnabled !== false;
    }
    if (els.electricAoe3dHaloFieldMinFeaturePoints) {
      els.electricAoe3dHaloFieldMinFeaturePoints.value = String(source.haloFieldMinFeaturePoints ?? 7);
    }
    if (els.electricAoe3dHaloFieldMaxFeaturePoints) {
      els.electricAoe3dHaloFieldMaxFeaturePoints.value = String(source.haloFieldMaxFeaturePoints ?? 12);
    }
    if (els.electricAoe3dHaloFieldSliceWidthBo) {
      els.electricAoe3dHaloFieldSliceWidthBo.value = String(source.haloFieldSliceWidthBo ?? 0.18);
    }
    if (els.electricAoe3dHaloFieldCellJitter) {
      els.electricAoe3dHaloFieldCellJitter.value = String(source.haloFieldCellJitter ?? 0.42);
    }
    if (els.electricAoe3dHaloFieldMinDriftSpeed) {
      els.electricAoe3dHaloFieldMinDriftSpeed.value = String(source.haloFieldMinDriftSpeed ?? 0.18);
    }
    if (els.electricAoe3dHaloFieldMaxDriftSpeed) {
      els.electricAoe3dHaloFieldMaxDriftSpeed.value = String(source.haloFieldMaxDriftSpeed ?? 0.55);
    }
    if (els.electricAoe3dHaloFieldMinDifferentialOffset) {
      els.electricAoe3dHaloFieldMinDifferentialOffset.value = String(source.haloFieldMinDifferentialOffset ?? 0.18);
    }
    if (els.electricAoe3dHaloFieldMaxDifferentialOffset) {
      els.electricAoe3dHaloFieldMaxDifferentialOffset.value = String(source.haloFieldMaxDifferentialOffset ?? 0.46);
    }
    if (els.electricAoe3dHaloFieldSeed) {
      els.electricAoe3dHaloFieldSeed.value = String(source.haloFieldSeed ?? 4242);
    }
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  function readBehaviorPreviewConfig(els = {}) {
    return capture(els);
  }

  function updateBehaviorReadout(els = {}) {
    if (!els || !els.electricAoe3dBehaviorReadout) return;
    const cfg = readBehaviorPreviewConfig(els);
    els.electricAoe3dBehaviorReadout.textContent = `Duration ${cfg.spellDurationMs}ms. Enemy range ${cfg.dominantBoltEnemyMinRangeBo}-${cfg.dominantBoltEnemyMaxRangeBo} BO, environment range ${cfg.dominantBoltMinRangeBo}-${cfg.dominantBoltMaxRangeBo} BO. Damage ${cfg.dominantBoltDamageMin}-${cfg.dominantBoltDamageMax}. Detour x${cfg.dominantBoltDetourRatioMax}.`;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
    readBehaviorPreviewConfig,
    updateBehaviorReadout,
  });
}
