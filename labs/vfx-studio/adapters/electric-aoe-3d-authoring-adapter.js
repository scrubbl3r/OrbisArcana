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
    return Object.freeze({
      ...defaults,
      dominantBoltMinRangeBo: minRange,
      dominantBoltMaxRangeBo: maxRange,
      dominantBoltRangeBo: maxRange,
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
