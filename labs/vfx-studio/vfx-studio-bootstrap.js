import { createStudioPreviewRegistry } from "./vfx-studio-preview-registry.js?v=20260524-tesla-i";
import { createStudioAuthoringAdapters } from "./vfx-studio-adapters.js?v=20260425d";
import { createStudioSurfaceActivation } from "./vfx-studio-activation.js?v=20260425d";

export function createStudioBootstrap({
  els,
  getElementById,
  adapterFactoriesByBaseEffect,
  adapterContext,
  draftStore,
  lastSelectedEffectValueRef,
  surfaces,
  liveBehaviorModulesByBaseEffect,
  selectedEffectOption,
  selectedBaseEffect,
  settingsKeyForBaseEffect,
  defaultSettingsKeyForBaseEffect,
  refreshEffectMeta,
  refreshBindingPanel,
  alignBindingTargetToSelectedEffect,
  persistDraftStore,
  applyOrbLaneSsot,
  buildCurrentLabOrbBaseVisualState,
  updateTeleportBehaviorReadout,
  updateFlameAoe3dBehaviorReadout,
  updateElectricAoe3dBehaviorReadout,
  applyGeometryVars,
  previewApplyMap,
  previewRootsByEffect,
  geometry,
  defaults,
  clamp,
  evenPx,
  clampByte,
  createScopedVarSetter,
  requestAnimationFrame: requestAnimationFrameImpl = requestAnimationFrame,
} = {}) {
  if (!els) throw new Error("createStudioBootstrap requires els");

  if (els.orbBaseD) els.orbBaseD.value = String(Math.round(defaults.orbBaseVisualDefaults.diameterPx));
  if (els.orbBaseStroke) els.orbBaseStroke.value = String(Math.round(defaults.orbBaseVisualDefaults.strokeWidthPx));
  if (els.orbBaseStrokeAlpha) els.orbBaseStrokeAlpha.value = String(Number(defaults.orbBaseVisualDefaults.strokeAlpha).toFixed(2));
  if (els.orbBaseFillAlpha) els.orbBaseFillAlpha.value = String(Number(defaults.orbBaseVisualDefaults.fillAlpha).toFixed(2));
  if (els.orbBaseStrokeR) els.orbBaseStrokeR.value = String(Math.round(defaults.orbBaseVisualDefaults.strokeDefaultRgb.r));
  if (els.orbBaseStrokeG) els.orbBaseStrokeG.value = String(Math.round(defaults.orbBaseVisualDefaults.strokeDefaultRgb.g));
  if (els.orbBaseStrokeB) els.orbBaseStrokeB.value = String(Math.round(defaults.orbBaseVisualDefaults.strokeDefaultRgb.b));
  if (els.orbBaseFillR) els.orbBaseFillR.value = String(Math.round(defaults.orbBaseVisualDefaults.fillDefaultRgb.r));
  if (els.orbBaseFillG) els.orbBaseFillG.value = String(Math.round(defaults.orbBaseVisualDefaults.fillDefaultRgb.g));
  if (els.orbBaseFillB) els.orbBaseFillB.value = String(Math.round(defaults.orbBaseVisualDefaults.fillDefaultRgb.b));
  if (els.orbNodFillAlpha) els.orbNodFillAlpha.value = String(Number(defaults.orbNodPresetDefault.orbTemplateFillAlpha).toFixed(2));
  if (els.orbNod3dFillAlpha) els.orbNod3dFillAlpha.value = String(Number(defaults.orbNod3dPresetDefault.orbNod3dFillAlpha).toFixed(2));

  const previewEls = Object.freeze({
    shield: Object.freeze({
      ...els,
      previewRoot: els.shieldPreviewRoot,
      shield: getElementById("shieldLaneShield"),
      orb: getElementById("shieldLaneOrb"),
    }),
    bubbleShield3d: Object.freeze({
      ...els,
      previewRoot: els.bubbleShield3dPreviewRoot,
    }),
    shock: Object.freeze({
      ...els,
      previewRoot: els.shockPreviewRoot,
      shockLayer: getElementById("shockLaneLayer"),
      orb: getElementById("shockLaneOrb"),
    }),
    shockwave3d: Object.freeze({
      ...els,
      previewRoot: els.shockwave3dPreviewRoot,
      previewShockwave3d: els.previewShockwave3d,
    }),
    flame: Object.freeze({
      ...els,
      previewRoot: els.flamePreviewRoot,
      flameLayer: getElementById("flameLaneLayer"),
      orb: getElementById("flameLaneOrb"),
    }),
    heal: Object.freeze({
      ...els,
      previewRoot: els.healPreviewRoot,
    }),
    electric: Object.freeze({
      ...els,
      previewRoot: els.electricPreviewRoot,
      electricLayer: getElementById("electricLaneLayer"),
      orb: getElementById("electricLaneOrb"),
    }),
    orbBase: Object.freeze({
      ...els,
      previewRoot: els.orbBasePreviewRoot,
      orb: getElementById("orbBaseLaneOrb"),
    }),
    orbTemplate: Object.freeze({
      ...els,
      previewRoot: els.orbTemplatePreviewRoot,
      orb: getElementById("orbTemplateLaneOrb"),
    }),
    orb3d: Object.freeze({
      ...els,
      previewRoot: els.orb3dPreviewRoot,
    }),
    orbSpawn: Object.freeze({
      ...els,
      previewRoot: els.orbSpawnPreviewRoot,
    }),
    orbNod: Object.freeze({
      ...els,
      previewRoot: els.orbNodPreviewRoot,
      orb: getElementById("orbNodLaneOrb"),
      previewOrbTemplate: els.previewOrbNod,
      orbTemplateShrinkPct: els.orbNodShrinkPct,
      orbTemplateApplyShrinkBtn: els.orbNodApplyShrinkBtn,
      orbTemplateDurationMs: els.orbNodDurationMs,
      orbTemplateApplyDurationBtn: els.orbNodApplyDurationBtn,
      orbTemplateFillAlpha: els.orbNodFillAlpha,
      orbTemplateApplyFillOpacityBtn: els.orbNodApplyFillOpacityBtn,
      orbTemplateWaveCount: els.orbNodWaveCount,
      orbTemplateApplyWaveCountBtn: els.orbNodApplyWaveCountBtn,
      orbTemplateWaveDepthPx: els.orbNodWaveDepthPx,
      orbTemplateApplyWaveDepthBtn: els.orbNodApplyWaveDepthBtn,
      orbTemplateOscillationSpeedHz: els.orbNodOscillationSpeedHz,
      orbTemplateApplyOscillationSpeedBtn: els.orbNodApplyOscillationSpeedBtn,
      orbTemplateOscillationCount: els.orbNodOscillationCount,
      orbTemplateApplyOscillationCountBtn: els.orbNodApplyOscillationCountBtn,
    }),
    orbNod3d: Object.freeze({
      ...els,
      previewRoot: els.orbNod3dPreviewRoot,
    }),
    orbLifecycle: Object.freeze({
      ...els,
      previewRoot: els.orbLifecyclePreviewRoot,
      orb: getElementById("orbLifecycleLaneOrb"),
      orbShatterLayer: getElementById("orbLifecycleShatterLayer"),
    }),
    orbLifecycle3d: Object.freeze({
      ...els,
      previewRoot: els.orbLifecycle3dPreviewRoot,
    }),
    orbGlobe: Object.freeze({
      ...els,
      previewRoot: els.orbGlobePreviewRoot,
      orb: getElementById("orbGlobeLaneOrb"),
      orbInterior: getElementById("orbGlobeLaneInterior"),
      orbGlobePreviewLayer: getElementById("orbGlobeLaneLayer"),
    }),
    orbGlobe3d: Object.freeze({
      ...els,
      previewRoot: els.orbGlobe3dPreviewRoot,
      previewOrbGlobe3d: els.previewOrbGlobe3d,
      orbGlobe3dAddBtn: els.orbGlobe3dAddBtn,
      orbGlobe3dBindBtn: els.orbGlobe3dBindBtn,
      orbGlobe3dClearBtn: els.orbGlobe3dClearBtn,
    }),
    worldGlobe: Object.freeze({
      ...els,
      previewRoot: els.worldGlobePreviewRoot,
      worldGlobePreviewLayer: getElementById("worldGlobeLaneLayer"),
    }),
    worldGlobe3d: Object.freeze({
      ...els,
      previewRoot: els.worldGlobe3dPreviewRoot,
      previewWorldGlobe3d: els.previewWorldGlobe3d,
    }),
    orbTeleport: Object.freeze({
      ...els,
      previewRoot: els.orbTeleportPreviewRoot,
      orb: getElementById("orbTeleportLaneOrb"),
    }),
    orbTeleport3d: Object.freeze({
      ...els,
      previewRoot: els.orbTeleport3dPreviewRoot,
      previewOrbTeleport3d: els.previewOrbTeleport3d,
    }),
    flameAoe3d: Object.freeze({
      ...els,
      previewRoot: els.flameAoe3dPreviewRoot,
      previewFlameAoe3d: els.previewFlameAoe3d,
    }),
    electricAoe3d: Object.freeze({
      ...els,
      previewRoot: els.flameAoe3dPreviewRoot,
      previewElectricAoe3d: els.previewElectricAoe3d,
      electricAoe3dOrbVisibleBtn: els.electricAoe3dOrbVisibleBtn,
      electricAoe3dControlPointsVisibleBtn: els.electricAoe3dControlPointsVisibleBtn,
      electricAoe3dHaloFieldVisibleBtn: els.electricAoe3dHaloFieldVisibleBtn,
      electricAoe3dSpellDurationMs: els.electricAoe3dSpellDurationMs,
      electricAoe3dDominantBoltMinRangeBo: els.electricAoe3dDominantBoltMinRangeBo,
      electricAoe3dDominantBoltMaxRangeBo: els.electricAoe3dDominantBoltMaxRangeBo,
      electricAoe3dDominantBoltEnemyMinRangeBo: els.electricAoe3dDominantBoltEnemyMinRangeBo,
      electricAoe3dDominantBoltEnemyMaxRangeBo: els.electricAoe3dDominantBoltEnemyMaxRangeBo,
      electricAoe3dDominantBoltEnvironmentFrequencyMinMs: els.electricAoe3dDominantBoltEnvironmentFrequencyMinMs,
      electricAoe3dDominantBoltEnvironmentFrequencyMaxMs: els.electricAoe3dDominantBoltEnvironmentFrequencyMaxMs,
      electricAoe3dDominantBoltEnemyFrequencyMinMs: els.electricAoe3dDominantBoltEnemyFrequencyMinMs,
      electricAoe3dDominantBoltEnemyFrequencyMaxMs: els.electricAoe3dDominantBoltEnemyFrequencyMaxMs,
      electricAoe3dDominantBoltDamageMin: els.electricAoe3dDominantBoltDamageMin,
      electricAoe3dDominantBoltDamageMax: els.electricAoe3dDominantBoltDamageMax,
      electricAoe3dDominantBoltDetourRatioMax: els.electricAoe3dDominantBoltDetourRatioMax,
      electricAoe3dDominantBoltMinStepBo: els.electricAoe3dDominantBoltMinStepBo,
      electricAoe3dDominantBoltMaxStepBo: els.electricAoe3dDominantBoltMaxStepBo,
      electricAoe3dDominantBoltSeekStrength: els.electricAoe3dDominantBoltSeekStrength,
      electricAoe3dDominantBoltHeadingMemory: els.electricAoe3dDominantBoltHeadingMemory,
      electricAoe3dDominantBoltWanderStrength: els.electricAoe3dDominantBoltWanderStrength,
      electricAoe3dDominantBoltPathJitterBo: els.electricAoe3dDominantBoltPathJitterBo,
      electricAoe3dBoltShaderVisibleBtn: els.electricAoe3dBoltShaderVisibleBtn,
      electricAoe3dBoltShaderEnabled: els.electricAoe3dBoltShaderEnabled,
      electricAoe3dBoltShaderCoreWidthMinBo: els.electricAoe3dBoltShaderCoreWidthMinBo,
      electricAoe3dBoltShaderCoreWidthMaxBo: els.electricAoe3dBoltShaderCoreWidthMaxBo,
      electricAoe3dBoltShaderGlowWidthMinBo: els.electricAoe3dBoltShaderGlowWidthMinBo,
      electricAoe3dBoltShaderGlowWidthMaxBo: els.electricAoe3dBoltShaderGlowWidthMaxBo,
      electricAoe3dBoltShaderLengthTaper: els.electricAoe3dBoltShaderLengthTaper,
      electricAoe3dBoltShaderTipOpacity: els.electricAoe3dBoltShaderTipOpacity,
      electricAoe3dBoltShaderCoreIntensity: els.electricAoe3dBoltShaderCoreIntensity,
      electricAoe3dBoltShaderCoreSoftness: els.electricAoe3dBoltShaderCoreSoftness,
      electricAoe3dBoltShaderGlowIntensity: els.electricAoe3dBoltShaderGlowIntensity,
      electricAoe3dBoltShaderGlowSoftness: els.electricAoe3dBoltShaderGlowSoftness,
      electricAoe3dBoltShaderFlickerSpeedHz: els.electricAoe3dBoltShaderFlickerSpeedHz,
      electricAoe3dBoltShaderFlickerDepth: els.electricAoe3dBoltShaderFlickerDepth,
      electricAoe3dBoltShaderCoreR: els.electricAoe3dBoltShaderCoreR,
      electricAoe3dBoltShaderCoreG: els.electricAoe3dBoltShaderCoreG,
      electricAoe3dBoltShaderCoreB: els.electricAoe3dBoltShaderCoreB,
      electricAoe3dBoltShaderGlowR: els.electricAoe3dBoltShaderGlowR,
      electricAoe3dBoltShaderGlowG: els.electricAoe3dBoltShaderGlowG,
      electricAoe3dBoltShaderGlowB: els.electricAoe3dBoltShaderGlowB,
      electricAoe3dHaloFieldEnabled: els.electricAoe3dHaloFieldEnabled,
      electricAoe3dHaloFieldShellRadiusBo: els.electricAoe3dHaloFieldShellRadiusBo,
      electricAoe3dHaloFieldBoltStartMinBo: els.electricAoe3dHaloFieldBoltStartMinBo,
      electricAoe3dHaloFieldBoltStartMaxBo: els.electricAoe3dHaloFieldBoltStartMaxBo,
      electricAoe3dHaloFieldBoltEndMinBo: els.electricAoe3dHaloFieldBoltEndMinBo,
      electricAoe3dHaloFieldBoltEndMaxBo: els.electricAoe3dHaloFieldBoltEndMaxBo,
      electricAoe3dHaloFieldPointCount: els.electricAoe3dHaloFieldPointCount,
      electricAoe3dHaloFieldWanderSpeedMin: els.electricAoe3dHaloFieldWanderSpeedMin,
      electricAoe3dHaloFieldWanderSpeedMax: els.electricAoe3dHaloFieldWanderSpeedMax,
      electricAoe3dHaloFieldWander: els.electricAoe3dHaloFieldWander,
      electricAoe3dHaloFieldWanderDurationMinMs: els.electricAoe3dHaloFieldWanderDurationMinMs,
      electricAoe3dHaloFieldWanderDurationMaxMs: els.electricAoe3dHaloFieldWanderDurationMaxMs,
      electricAoe3dHaloFieldLingerMinMs: els.electricAoe3dHaloFieldLingerMinMs,
      electricAoe3dHaloFieldLingerMaxMs: els.electricAoe3dHaloFieldLingerMaxMs,
      electricAoe3dHaloFieldLingerDrift: els.electricAoe3dHaloFieldLingerDrift,
      electricAoe3dHaloFieldReversalChance: els.electricAoe3dHaloFieldReversalChance,
      electricAoe3dHaloFieldZMinBo: els.electricAoe3dHaloFieldZMinBo,
      electricAoe3dHaloFieldZMaxBo: els.electricAoe3dHaloFieldZMaxBo,
      electricAoe3dHaloFieldSeed: els.electricAoe3dHaloFieldSeed,
      electricAoe3dHaloBoltShapeMinStepBo: els.electricAoe3dHaloBoltShapeMinStepBo,
      electricAoe3dHaloBoltShapeMaxStepBo: els.electricAoe3dHaloBoltShapeMaxStepBo,
      electricAoe3dHaloBoltShapeSeekStrength: els.electricAoe3dHaloBoltShapeSeekStrength,
      electricAoe3dHaloBoltShapeHeadingMemory: els.electricAoe3dHaloBoltShapeHeadingMemory,
      electricAoe3dHaloBoltShapeWanderStrength: els.electricAoe3dHaloBoltShapeWanderStrength,
      electricAoe3dHaloBoltShapePathJitterBo: els.electricAoe3dHaloBoltShapePathJitterBo,
      electricAoe3dHaloBoltShapeSpeedHz: els.electricAoe3dHaloBoltShapeSpeedHz,
      electricAoe3dHaloBoltShapeSmoothing: els.electricAoe3dHaloBoltShapeSmoothing,
      electricAoe3dHaloBoltForkChance: els.electricAoe3dHaloBoltForkChance,
      electricAoe3dHaloBoltForkTtlMinMs: els.electricAoe3dHaloBoltForkTtlMinMs,
      electricAoe3dHaloBoltForkTtlMaxMs: els.electricAoe3dHaloBoltForkTtlMaxMs,
      electricAoe3dHaloBoltForkStartPct: els.electricAoe3dHaloBoltForkStartPct,
      electricAoe3dHaloBoltForkEndPct: els.electricAoe3dHaloBoltForkEndPct,
      electricAoe3dHaloBoltForkSpreadMinBo: els.electricAoe3dHaloBoltForkSpreadMinBo,
      electricAoe3dHaloBoltForkSpreadMaxBo: els.electricAoe3dHaloBoltForkSpreadMaxBo,
      electricAoe3dHaloBoltForkZTineMinBo: els.electricAoe3dHaloBoltForkZTineMinBo,
      electricAoe3dHaloBoltForkZTineMaxBo: els.electricAoe3dHaloBoltForkZTineMaxBo,
      electricAoe3dHaloBoltForkTargetOffsetBo: els.electricAoe3dHaloBoltForkTargetOffsetBo,
      electricAoe3dHaloBoltBranchEnabled: els.electricAoe3dHaloBoltBranchEnabled,
      electricAoe3dHaloBoltBranchChance: els.electricAoe3dHaloBoltBranchChance,
      electricAoe3dHaloBoltBranchTotalMin: els.electricAoe3dHaloBoltBranchTotalMin,
      electricAoe3dHaloBoltBranchTotalMax: els.electricAoe3dHaloBoltBranchTotalMax,
      electricAoe3dHaloBoltBranchRangeStartPct: els.electricAoe3dHaloBoltBranchRangeStartPct,
      electricAoe3dHaloBoltBranchRangeEndPct: els.electricAoe3dHaloBoltBranchRangeEndPct,
      electricAoe3dHaloBoltBranchLengthMinBo: els.electricAoe3dHaloBoltBranchLengthMinBo,
      electricAoe3dHaloBoltBranchLengthMaxBo: els.electricAoe3dHaloBoltBranchLengthMaxBo,
      electricAoe3dHaloBoltBranchAngleMinDeg: els.electricAoe3dHaloBoltBranchAngleMinDeg,
      electricAoe3dHaloBoltBranchAngleMaxDeg: els.electricAoe3dHaloBoltBranchAngleMaxDeg,
      electricAoe3dHaloBoltBranchTtlMinMs: els.electricAoe3dHaloBoltBranchTtlMinMs,
      electricAoe3dHaloBoltBranchTtlMaxMs: els.electricAoe3dHaloBoltBranchTtlMaxMs,
      electricAoe3dHaloBoltBranchStepMinBo: els.electricAoe3dHaloBoltBranchStepMinBo,
      electricAoe3dHaloBoltBranchStepMaxBo: els.electricAoe3dHaloBoltBranchStepMaxBo,
      electricAoe3dHaloBoltBranchBendStrength: els.electricAoe3dHaloBoltBranchBendStrength,
      electricAoe3dHaloBoltBranchCurlStrength: els.electricAoe3dHaloBoltBranchCurlStrength,
      electricAoe3dHaloBoltBranchShapeScale: els.electricAoe3dHaloBoltBranchShapeScale,
    }),
    tesla1: Object.freeze({
      ...els,
      previewRoot: els.flameAoe3dPreviewRoot,
      previewElectricAoe3d: els.previewTesla1,
      electricAoe3dOrbVisibleBtn: els.tesla1OrbVisibleBtn,
      electricAoe3dBoltShaderVisibleBtn: els.tesla1LightningShaderVisibleBtn,
      electricAoe3dControlPointsVisibleBtn: els.tesla1MasterBoltVisibleBtn,
      electricAoe3dHaloFieldVisibleBtn: els.tesla1HaloVisibleBtn,
      electricAoe3dDominantBoltMinRangeBo: els.tesla1MasterBoltMinRangeBo,
      electricAoe3dDominantBoltMaxRangeBo: els.tesla1MasterBoltMaxRangeBo,
      electricAoe3dDominantBoltDetourRatioMax: els.tesla1MasterBoltPathBendAllowance,
      electricAoe3dBoltShaderEnabled: els.tesla1BoltShaderEnabled,
      electricAoe3dHaloFieldEnabled: els.tesla1HaloFieldEnabled,
      electricAoe3dHaloFieldShellRadiusBo: els.tesla1HaloFieldShellRadiusBo,
      electricAoe3dHaloFieldBoltStartMinBo: els.tesla1HaloFieldBoltStartMinBo,
      electricAoe3dHaloFieldBoltStartMaxBo: els.tesla1HaloFieldBoltStartMaxBo,
      electricAoe3dHaloFieldBoltEndMinBo: els.tesla1HaloFieldBoltEndMinBo,
      electricAoe3dHaloFieldBoltEndMaxBo: els.tesla1HaloFieldBoltEndMaxBo,
      electricAoe3dHaloFieldPointCount: els.tesla1HaloBoltCountMax,
      electricAoe3dHaloFieldWanderSpeedMin: null,
      electricAoe3dHaloFieldWanderSpeedMax: null,
      electricAoe3dHaloFieldWander: null,
      electricAoe3dHaloFieldWanderDurationMinMs: null,
      electricAoe3dHaloFieldWanderDurationMaxMs: null,
      electricAoe3dHaloFieldLingerMinMs: null,
      electricAoe3dHaloFieldLingerMaxMs: null,
      electricAoe3dHaloFieldLingerDrift: null,
      electricAoe3dHaloFieldReversalChance: null,
      electricAoe3dHaloFieldZMinBo: null,
      electricAoe3dHaloFieldZMaxBo: null,
      electricAoe3dHaloFieldSeed: null,
      electricAoe3dHaloBoltShapeMinStepBo: null,
      electricAoe3dHaloBoltShapeMaxStepBo: null,
      electricAoe3dHaloBoltShapeSeekStrength: null,
      electricAoe3dHaloBoltShapeHeadingMemory: null,
      electricAoe3dHaloBoltShapeWanderStrength: null,
      electricAoe3dHaloBoltShapePathJitterBo: null,
      electricAoe3dHaloBoltShapeSpeedHz: null,
      electricAoe3dHaloBoltShapeSmoothing: null,
      electricAoe3dHaloBoltForkChance: null,
      electricAoe3dHaloBoltBranchEnabled: null,
      electricAoe3dHaloBoltBranchChance: null,
    }),
    bankOrb3d: Object.freeze({
      ...els,
      previewRoot: els.bankOrb3dPreviewRoot,
      previewBankOrb3d: els.previewBankOrb3d,
    }),
  });

  const studioPreviewRegistry = createStudioPreviewRegistry({
    els,
    GEOM: geometry,
    clamp,
    evenPx,
    clampByte,
    createScopedVarSetter,
    previewEls,
    defaults: Object.freeze({
      shockwavePresetDefault: defaults.shockwavePresetDefault,
      flamePresetDefault: defaults.flamePresetDefault,
      electricPresetDefault: defaults.electricPresetDefault,
      orbNod3dPresetDefault: defaults.orbNod3dPresetDefault,
    }),
    getOrbBaseVisualState: buildCurrentLabOrbBaseVisualState,
    onOrbBaseVisualStateApplied: (visualState, previewActions) => {
      if (typeof defaults.onOrbBaseVisualStateApplied === "function") {
        defaults.onOrbBaseVisualStateApplied(visualState, previewActions);
      }
    },
    previewRootsByEffect,
    updateTeleportBehaviorReadout,
    updateFlameAoe3dBehaviorReadout,
    updateElectricAoe3dBehaviorReadout,
  });

  const studioAuthoringAdapters = createStudioAuthoringAdapters({
    factoriesByBaseEffect: adapterFactoriesByBaseEffect,
    context: adapterContext,
    previewApplyByBaseEffect: previewApplyMap,
    applyOptionsByBaseEffect: Object.freeze({
      "bubble-shield": Object.freeze({
        applyGeometry: () => studioPreviewRegistry.actions.applyShieldGeometry(),
        applyShield: () => studioPreviewRegistry.actions.applyShield(),
        applyPulse: () => studioPreviewRegistry.actions.applyPulse(),
      }),
    }),
  });

  function defaultSettingsForBaseEffect(baseEffect) {
    return studioAuthoringAdapters.defaultSettingsForBaseEffect(baseEffect, {
      defaultSettingsKeyForBaseEffect,
      fallbackDefaultSettings: (defaultSettingsKey) => {
        switch (String(defaultSettingsKey || "")) {
          case "orb-template":
            return {};
          default:
            return {};
        }
      },
    });
  }

  function captureCurrentEffectSettings(baseEffect) {
    return studioAuthoringAdapters.captureCurrentEffectSettings(baseEffect, els, {
      fallbackCapture: (effect) => {
        switch (String(effect || "")) {
          case "orb-template":
            return {};
          default:
            return {};
        }
      },
    });
  }

  let suspendDraftApplyRef = { value: false };

  function setSuspendDraftApplyRef(ref) {
    suspendDraftApplyRef = ref || suspendDraftApplyRef;
  }

  function applyCurrentEffectSettings(baseEffect, settings) {
    if (!settings || typeof settings !== "object") return;
    suspendDraftApplyRef.value = true;
    try {
      studioAuthoringAdapters.applyCurrentEffectSettings(baseEffect, settings, els, {
        fallbackApply: (effect) => {
          switch (String(effect || "")) {
            case "orb-template":
              applyOrbLaneSsot(els.orbTemplatePreviewRoot);
              break;
            default:
              break;
          }
        },
      });
    } finally {
      suspendDraftApplyRef.value = false;
    }
  }

  function applyDraftToSelectedProfile() {
    if (!defaults.isDraftHydrationDone() || suspendDraftApplyRef.value) return;
    const opt = selectedEffectOption();
    if (!opt) return;
    const baseEffect = String(opt.dataset.baseEffect || selectedBaseEffect() || "");
    const profile = draftStore.profilesByValue[String(opt.value || "")];
    if (!profile) {
      applyCurrentEffectSettings(baseEffect, defaultSettingsForBaseEffect(baseEffect));
      return;
    }
    const profileBaseEffect = String(opt.dataset.baseEffect || profile.baseEffect || "");
    const settingsByBase = profile.settingsByBaseEffect && typeof profile.settingsByBaseEffect === "object"
      ? profile.settingsByBaseEffect
      : null;
    if (!settingsByBase) {
      applyCurrentEffectSettings(profileBaseEffect || baseEffect, defaultSettingsForBaseEffect(profileBaseEffect || baseEffect));
      return;
    }
    const settingsKey = settingsKeyForBaseEffect(profileBaseEffect);
    const settings = settingsByBase[settingsKey] || settingsByBase[profileBaseEffect];
    if (settings) {
      applyCurrentEffectSettings(profileBaseEffect, settings);
    } else {
      applyCurrentEffectSettings(profileBaseEffect, defaultSettingsForBaseEffect(profileBaseEffect));
    }
  }

  const studioSurfaceActivation = createStudioSurfaceActivation({
    els,
    surfaces,
    liveBehaviorModulesByBaseEffect,
    autoPreviewActions: Object.freeze({
      playShield: () => studioPreviewRegistry.actions.playShield(),
      playShock: () => studioPreviewRegistry.actions.playShock(),
      playFlame: () => studioPreviewRegistry.actions.playFlame(),
      playElectric: () => studioPreviewRegistry.actions.playElectric(),
      playBubbleShield3d: () => studioPreviewRegistry.actions.playBubbleShield3d(),
      applyOrbBase: () => studioPreviewRegistry.actions.applyOrbBase(),
      applyOrbTemplate: () => studioPreviewRegistry.actions.applyOrbTemplate(),
      applyOrb3d: () => studioPreviewRegistry.actions.applyOrb3d(),
      applyOrbSpawn: () => studioPreviewRegistry.actions.applyOrbSpawn(),
      applyOrbNod: () => studioPreviewRegistry.actions.applyOrbNod(),
      applyOrbNod3d: () => studioPreviewRegistry.actions.applyOrbNod3d(),
      applyOrbLifecycle: () => studioPreviewRegistry.actions.applyOrbLifecycle(),
      applyOrbGlobe: () => studioPreviewRegistry.actions.applyOrbGlobe(),
      applyOrbGlobe3d: () => studioPreviewRegistry.actions.applyOrbGlobe3d(),
      applyWorldGlobe: () => studioPreviewRegistry.actions.applyWorldGlobe(),
      applyWorldGlobe3d: () => studioPreviewRegistry.actions.applyWorldGlobe3d(),
      applyOrbTeleport: () => studioPreviewRegistry.actions.applyOrbTeleport(),
      applyOrbTeleport3d: () => studioPreviewRegistry.actions.applyOrbTeleport3d(),
      applyFlameAoe3d: () => studioPreviewRegistry.actions.applyFlameAoe3d(),
      applyElectricAoe3d: () => studioPreviewRegistry.actions.applyElectricAoe3d(),
      applyTesla1: () => studioPreviewRegistry.actions.applyTesla1(),
      applyBankOrb3d: () => studioPreviewRegistry.actions.applyBankOrb3d(),
    }),
    selectedEffectOption,
    selectedBaseEffect,
    stopAllStudioEffects: studioPreviewRegistry.stopAllStudioEffects,
    lastSelectedEffectValueRef,
    draftStore,
    applyDraftToSelectedProfile,
    persistDraftStore,
    refreshEffectMeta,
    previewRootsByEffect,
    alignBindingTargetToSelectedEffect,
    refreshBindingPanel,
    updateBehaviorReadout: (effect) => {
      if (effect === "teleport") updateTeleportBehaviorReadout();
      if (effect === "flame-aoe-3d" && typeof updateFlameAoe3dBehaviorReadout === "function") {
        updateFlameAoe3dBehaviorReadout();
      }
      if (effect === "electric-aoe-3d" && typeof updateElectricAoe3dBehaviorReadout === "function") {
        updateElectricAoe3dBehaviorReadout();
      }
      if (effect === "teleport-3d" && typeof defaults.updateTeleport3dBehaviorReadout === "function") {
        defaults.updateTeleport3dBehaviorReadout();
      }
    },
    requestAnimationFrame: requestAnimationFrameImpl,
  });

  studioSurfaceActivation.bindPaneEvents();

  return Object.freeze({
    actions: studioPreviewRegistry.actions,
    applyCurrentEffectSettings,
    authoringAdapterForBaseEffect: studioAuthoringAdapters.authoringAdapterForBaseEffect,
    callAuthoringAdapter: studioAuthoringAdapters.callAuthoringAdapter,
    captureCurrentEffectSettings,
    defaultSettingsForBaseEffect,
    setSuspendDraftApplyRef,
    stopAllStudioEffects: studioPreviewRegistry.stopAllStudioEffects,
    updateBehaviorSections: studioSurfaceActivation.updateBehaviorSections,
    updateEffectSections: studioSurfaceActivation.updateEffectSections,
    settleSelectedEffectState: studioSurfaceActivation.settleSelectedEffectState,
    autoPreviewSelectedEffect: studioSurfaceActivation.autoPreviewSelectedEffect,
  });
}
