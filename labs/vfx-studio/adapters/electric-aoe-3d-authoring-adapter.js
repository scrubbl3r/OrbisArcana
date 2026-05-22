import { ELECTRIC_AOE_3D_PRESET_DEFAULT } from "../../../src/vfx/presets/electric-aoe-3d-default.js?v=20260522-halo-length-a";
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
      haloBoltShapeMinStepBo: readNumber(els.electricAoe3dHaloBoltShapeMinStepBo, defaults.haloBoltShapeMinStepBo, 0.01, 8),
      haloBoltShapeMaxStepBo: readNumber(els.electricAoe3dHaloBoltShapeMaxStepBo, defaults.haloBoltShapeMaxStepBo, 0.01, 8),
      haloBoltShapeSeekStrength: readNumber(els.electricAoe3dHaloBoltShapeSeekStrength, defaults.haloBoltShapeSeekStrength, 0, 4),
      haloBoltShapeHeadingMemory: readNumber(els.electricAoe3dHaloBoltShapeHeadingMemory, defaults.haloBoltShapeHeadingMemory, 0, 1),
      haloBoltShapeWanderStrength: readNumber(els.electricAoe3dHaloBoltShapeWanderStrength, defaults.haloBoltShapeWanderStrength, 0, 4),
      haloBoltShapePathJitterBo: readNumber(els.electricAoe3dHaloBoltShapePathJitterBo, defaults.haloBoltShapePathJitterBo, 0, 4),
      haloBoltShapeSpeedHz: readNumber(els.electricAoe3dHaloBoltShapeSpeedHz, defaults.haloBoltShapeSpeedHz, 0, 120),
      haloBoltShapeSmoothing: readNumber(els.electricAoe3dHaloBoltShapeSmoothing, defaults.haloBoltShapeSmoothing, 0, 1),
      haloBoltForkChance: readNumber(els.electricAoe3dHaloBoltForkChance, defaults.haloBoltForkChance, 0, 1),
      haloBoltForkTtlMs: Math.round(readNumber(els.electricAoe3dHaloBoltForkTtlMs, defaults.haloBoltForkTtlMs, 16, 20000)),
      haloBoltForkStartPct: readNumber(els.electricAoe3dHaloBoltForkStartPct, defaults.haloBoltForkStartPct, 0, 1),
      haloBoltForkEndPct: readNumber(els.electricAoe3dHaloBoltForkEndPct, defaults.haloBoltForkEndPct, 0, 1),
      haloBoltForkSpreadMinBo: readNumber(els.electricAoe3dHaloBoltForkSpreadMinBo, defaults.haloBoltForkSpreadMinBo, 0, 8),
      haloBoltForkSpreadMaxBo: readNumber(els.electricAoe3dHaloBoltForkSpreadMaxBo, defaults.haloBoltForkSpreadMaxBo, 0, 8),
      haloBoltForkZTineMinBo: readNumber(els.electricAoe3dHaloBoltForkZTineMinBo, defaults.haloBoltForkZTineMinBo, 0, 8),
      haloBoltForkZTineMaxBo: readNumber(els.electricAoe3dHaloBoltForkZTineMaxBo, defaults.haloBoltForkZTineMaxBo, 0, 8),
      haloBoltForkTargetOffsetBo: readNumber(els.electricAoe3dHaloBoltForkTargetOffsetBo, defaults.haloBoltForkTargetOffsetBo, 0, 8),
      haloFieldEnabled: readBoolean(els.electricAoe3dHaloFieldEnabled, defaults.haloFieldEnabled),
      haloFieldLingerMinMs: Math.round(readNumber(els.electricAoe3dHaloFieldLingerMinMs, defaults.haloFieldLingerMinMs ?? defaults.haloFieldReversalFrequencyMinMs, 50, 20000)),
      haloFieldLingerMaxMs: Math.round(readNumber(els.electricAoe3dHaloFieldLingerMaxMs, defaults.haloFieldLingerMaxMs ?? defaults.haloFieldReversalFrequencyMaxMs, 50, 20000)),
      haloFieldLingerDrift: readNumber(els.electricAoe3dHaloFieldLingerDrift, defaults.haloFieldLingerDrift, 0, 1),
      haloFieldPointCount: Math.round(readNumber(els.electricAoe3dHaloFieldPointCount, defaults.haloFieldPointCount, 0, 256)),
      haloFieldPointDiameterBo: 0.05,
      haloFieldSeed: Math.round(readNumber(els.electricAoe3dHaloFieldSeed, defaults.haloFieldSeed, 1, 999999999)),
      haloFieldShellRadiusBo: readNumber(els.electricAoe3dHaloFieldShellRadiusBo, defaults.haloFieldShellRadiusBo, 0.5, 32),
      haloFieldBoltLengthMinBo: readNumber(els.electricAoe3dHaloFieldBoltLengthMinBo, defaults.haloFieldBoltLengthMinBo, 0.05, 32),
      haloFieldBoltLengthMaxBo: readNumber(els.electricAoe3dHaloFieldBoltLengthMaxBo, defaults.haloFieldBoltLengthMaxBo, 0.05, 32),
      haloFieldReversalChance: readNumber(els.electricAoe3dHaloFieldReversalChance, defaults.haloFieldReversalChance, 0, 1),
      haloFieldWander: readNumber(els.electricAoe3dHaloFieldWander, defaults.haloFieldWander, 0, 2),
      haloFieldWanderDurationMinMs: Math.round(readNumber(els.electricAoe3dHaloFieldWanderDurationMinMs, defaults.haloFieldWanderDurationMinMs, 50, 20000)),
      haloFieldWanderDurationMaxMs: Math.round(readNumber(els.electricAoe3dHaloFieldWanderDurationMaxMs, defaults.haloFieldWanderDurationMaxMs, 50, 20000)),
      haloFieldWanderSpeedMin: readNumber(els.electricAoe3dHaloFieldWanderSpeedMin, defaults.haloFieldWanderSpeedMin ?? defaults.haloFieldWanderSpeed, 0, 64),
      haloFieldWanderSpeedMax: readNumber(els.electricAoe3dHaloFieldWanderSpeedMax, defaults.haloFieldWanderSpeedMax ?? defaults.haloFieldWanderSpeed, 0, 64),
      haloFieldZMinBo: readNumber(els.electricAoe3dHaloFieldZMinBo, defaults.haloFieldZMinBo, -32, 32),
      haloFieldZMaxBo: readNumber(els.electricAoe3dHaloFieldZMaxBo, defaults.haloFieldZMaxBo, -32, 32),
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
    if (els.electricAoe3dHaloFieldEnabled) {
      els.electricAoe3dHaloFieldEnabled.checked = source.haloFieldEnabled !== false;
    }
    if (els.electricAoe3dHaloFieldShellRadiusBo) {
      els.electricAoe3dHaloFieldShellRadiusBo.value = String(source.haloFieldShellRadiusBo ?? 1.5);
    }
    if (els.electricAoe3dHaloFieldBoltLengthMinBo) {
      els.electricAoe3dHaloFieldBoltLengthMinBo.value = String(source.haloFieldBoltLengthMinBo ?? source.haloFieldShellRadiusBo ?? 1.5);
    }
    if (els.electricAoe3dHaloFieldBoltLengthMaxBo) {
      els.electricAoe3dHaloFieldBoltLengthMaxBo.value = String(source.haloFieldBoltLengthMaxBo ?? source.haloFieldShellRadiusBo ?? 1.5);
    }
    if (els.electricAoe3dHaloFieldPointCount) {
      els.electricAoe3dHaloFieldPointCount.value = String(source.haloFieldPointCount ?? 24);
    }
    if (els.electricAoe3dHaloFieldWanderSpeedMin) {
      els.electricAoe3dHaloFieldWanderSpeedMin.value = String(source.haloFieldWanderSpeedMin ?? source.haloFieldWanderSpeed ?? 0.25);
    }
    if (els.electricAoe3dHaloFieldWanderSpeedMax) {
      els.electricAoe3dHaloFieldWanderSpeedMax.value = String(source.haloFieldWanderSpeedMax ?? source.haloFieldWanderSpeed ?? 0.75);
    }
    if (els.electricAoe3dHaloFieldWander) {
      els.electricAoe3dHaloFieldWander.value = String(source.haloFieldWander ?? 0.35);
    }
    if (els.electricAoe3dHaloFieldWanderDurationMinMs) {
      els.electricAoe3dHaloFieldWanderDurationMinMs.value = String(source.haloFieldWanderDurationMinMs ?? 1200);
    }
    if (els.electricAoe3dHaloFieldWanderDurationMaxMs) {
      els.electricAoe3dHaloFieldWanderDurationMaxMs.value = String(source.haloFieldWanderDurationMaxMs ?? 3200);
    }
    if (els.electricAoe3dHaloFieldLingerMinMs) {
      els.electricAoe3dHaloFieldLingerMinMs.value = String(source.haloFieldLingerMinMs ?? source.haloFieldReversalFrequencyMinMs ?? source.haloFieldDirectionHoldMinMs ?? 900);
    }
    if (els.electricAoe3dHaloFieldLingerMaxMs) {
      els.electricAoe3dHaloFieldLingerMaxMs.value = String(source.haloFieldLingerMaxMs ?? source.haloFieldReversalFrequencyMaxMs ?? source.haloFieldDirectionHoldMaxMs ?? 2600);
    }
    if (els.electricAoe3dHaloFieldLingerDrift) {
      els.electricAoe3dHaloFieldLingerDrift.value = String(source.haloFieldLingerDrift ?? 0);
    }
    if (els.electricAoe3dHaloFieldReversalChance) {
      els.electricAoe3dHaloFieldReversalChance.value = String(source.haloFieldReversalChance ?? 0.35);
    }
    if (els.electricAoe3dHaloFieldZMinBo) {
      els.electricAoe3dHaloFieldZMinBo.value = String(source.haloFieldZMinBo ?? -1.5);
    }
    if (els.electricAoe3dHaloFieldZMaxBo) {
      els.electricAoe3dHaloFieldZMaxBo.value = String(source.haloFieldZMaxBo ?? 1.5);
    }
    if (els.electricAoe3dHaloFieldSeed) {
      els.electricAoe3dHaloFieldSeed.value = String(source.haloFieldSeed ?? 4242);
    }
    if (els.electricAoe3dHaloBoltShapeMinStepBo) {
      els.electricAoe3dHaloBoltShapeMinStepBo.value = String(source.haloBoltShapeMinStepBo ?? 0.05);
    }
    if (els.electricAoe3dHaloBoltShapeMaxStepBo) {
      els.electricAoe3dHaloBoltShapeMaxStepBo.value = String(source.haloBoltShapeMaxStepBo ?? 0.28);
    }
    if (els.electricAoe3dHaloBoltShapeSeekStrength) {
      els.electricAoe3dHaloBoltShapeSeekStrength.value = String(source.haloBoltShapeSeekStrength ?? 0.42);
    }
    if (els.electricAoe3dHaloBoltShapeHeadingMemory) {
      els.electricAoe3dHaloBoltShapeHeadingMemory.value = String(source.haloBoltShapeHeadingMemory ?? 0.72);
    }
    if (els.electricAoe3dHaloBoltShapeWanderStrength) {
      els.electricAoe3dHaloBoltShapeWanderStrength.value = String(source.haloBoltShapeWanderStrength ?? 0.9);
    }
    if (els.electricAoe3dHaloBoltShapePathJitterBo) {
      els.electricAoe3dHaloBoltShapePathJitterBo.value = String(source.haloBoltShapePathJitterBo ?? 0.18);
    }
    if (els.electricAoe3dHaloBoltShapeSpeedHz) {
      els.electricAoe3dHaloBoltShapeSpeedHz.value = String(source.haloBoltShapeSpeedHz ?? 18);
    }
    if (els.electricAoe3dHaloBoltShapeSmoothing) {
      els.electricAoe3dHaloBoltShapeSmoothing.value = String(source.haloBoltShapeSmoothing ?? 0.18);
    }
    if (els.electricAoe3dHaloBoltForkChance) {
      els.electricAoe3dHaloBoltForkChance.value = String(source.haloBoltForkChance ?? 0);
    }
    if (els.electricAoe3dHaloBoltForkTtlMs) {
      els.electricAoe3dHaloBoltForkTtlMs.value = String(source.haloBoltForkTtlMs ?? 180);
    }
    if (els.electricAoe3dHaloBoltForkStartPct) {
      els.electricAoe3dHaloBoltForkStartPct.value = String(source.haloBoltForkStartPct ?? 0.33);
    }
    if (els.electricAoe3dHaloBoltForkEndPct) {
      els.electricAoe3dHaloBoltForkEndPct.value = String(source.haloBoltForkEndPct ?? 0.75);
    }
    if (els.electricAoe3dHaloBoltForkSpreadMinBo) {
      els.electricAoe3dHaloBoltForkSpreadMinBo.value = String(source.haloBoltForkSpreadMinBo ?? source.haloBoltForkSpreadBo ?? 0.22);
    }
    if (els.electricAoe3dHaloBoltForkSpreadMaxBo) {
      els.electricAoe3dHaloBoltForkSpreadMaxBo.value = String(source.haloBoltForkSpreadMaxBo ?? source.haloBoltForkSpreadBo ?? 0.46);
    }
    if (els.electricAoe3dHaloBoltForkZTineMinBo) {
      els.electricAoe3dHaloBoltForkZTineMinBo.value = String(source.haloBoltForkZTineMinBo ?? 0);
    }
    if (els.electricAoe3dHaloBoltForkZTineMaxBo) {
      els.electricAoe3dHaloBoltForkZTineMaxBo.value = String(source.haloBoltForkZTineMaxBo ?? 0.08);
    }
    if (els.electricAoe3dHaloBoltForkTargetOffsetBo) {
      els.electricAoe3dHaloBoltForkTargetOffsetBo.value = String(source.haloBoltForkTargetOffsetBo ?? 0.18);
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
