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
