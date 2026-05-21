import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../../../src/vfx/presets/electric-aoe-3d-default.js?v=20260521a";
import { ELECTRIC_AOE_BEHAVIOR_DEFAULT } from "../../../src/game-runtime/behaviors/electric-aoe-behavior-default.js?v=20260521a";

export function createElectricAoe3dAuthoringAdapter({
  electricAoe3dPresetDefault = ELECTRIC_AOE_3D_PRESET_DEFAULT,
  electricAoe3dBehaviorDefault = ELECTRIC_AOE_BEHAVIOR_DEFAULT,
} = {}) {
  function readNumber(el, fallback, min = -Infinity, max = Infinity) {
    const numeric = Number(el && el.value);
    const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
    return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
  }

  function defaultSettings() {
    return {
      ...electricAoe3dPresetDefault,
      ...electricAoe3dBehaviorDefault,
    };
  }

  function capture(els = {}) {
    const defaults = defaultSettings();
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
    return Object.freeze({
      ...defaults,
      dominantBoltHeadingMemory: readNumber(els.electricAoe3dDominantBoltHeadingMemory, defaults.dominantBoltHeadingMemory, 0, 1),
      dominantBoltMinRangeBo: minRange,
      dominantBoltMaxRangeBo: maxRange,
      dominantBoltMinStepBo: minStep,
      dominantBoltMaxStepBo: maxStep,
      dominantBoltPathJitterBo: readNumber(els.electricAoe3dDominantBoltPathJitterBo, defaults.dominantBoltPathJitterBo, 0, 2),
      dominantBoltRangeBo: maxRange,
      dominantBoltSeekStrength: readNumber(els.electricAoe3dDominantBoltSeekStrength, defaults.dominantBoltSeekStrength, 0, 4),
      dominantBoltWanderStrength: readNumber(els.electricAoe3dDominantBoltWanderStrength, defaults.dominantBoltWanderStrength, 0, 4),
    });
  }

  function apply(els = {}, settings = null, { applyPreview = null } = {}) {
    const source = settings && typeof settings === "object" ? settings : defaultSettings();
    if (els.electricAoe3dDominantBoltMinRangeBo) {
      els.electricAoe3dDominantBoltMinRangeBo.value = String(source.dominantBoltMinRangeBo ?? source.dominantBoltRangeBo ?? 2);
    }
    if (els.electricAoe3dDominantBoltMaxRangeBo) {
      els.electricAoe3dDominantBoltMaxRangeBo.value = String(source.dominantBoltMaxRangeBo ?? source.dominantBoltRangeBo ?? 8);
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
    if (typeof applyPreview === "function") applyPreview();
    return true;
  }

  return Object.freeze({
    defaultSettings,
    capture,
    apply,
    readBehaviorPreviewConfig: () => Object.freeze({}),
    updateBehaviorReadout: () => {},
  });
}
