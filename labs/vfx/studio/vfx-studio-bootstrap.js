import { createStudioPreviewRegistry } from "./vfx-studio-preview-registry.js";
import { createStudioAuthoringAdapters } from "./vfx-studio-adapters.js";
import { createStudioSurfaceActivation } from "./vfx-studio-activation.js";

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
  applyGeometryVars,
  applyPreviewMap,
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

  const previewEls = Object.freeze({
    shield: Object.freeze({
      ...els,
      previewRoot: els.shieldPreviewRoot,
      shield: getElementById("shieldLaneShield"),
      orb: getElementById("shieldLaneOrb"),
    }),
    shock: Object.freeze({
      ...els,
      previewRoot: els.shockPreviewRoot,
      shockLayer: getElementById("shockLaneLayer"),
      orb: getElementById("shockLaneOrb"),
    }),
    flame: Object.freeze({
      ...els,
      previewRoot: els.flamePreviewRoot,
      flameLayer: getElementById("flameLaneLayer"),
      orb: getElementById("flameLaneOrb"),
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
    orbLifecycle: Object.freeze({
      ...els,
      previewRoot: els.orbLifecyclePreviewRoot,
      orb: getElementById("orbLifecycleLaneOrb"),
      orbShatterLayer: getElementById("orbLifecycleShatterLayer"),
    }),
    orbGlobe: Object.freeze({
      ...els,
      previewRoot: els.orbGlobePreviewRoot,
      orb: getElementById("orbGlobeLaneOrb"),
      orbInterior: getElementById("orbGlobeLaneInterior"),
      orbGlobePreviewLayer: getElementById("orbGlobeLaneLayer"),
    }),
    worldGlobe: Object.freeze({
      ...els,
      previewRoot: els.worldGlobePreviewRoot,
      worldGlobePreviewLayer: getElementById("worldGlobeLaneLayer"),
    }),
    orbTeleport: Object.freeze({
      ...els,
      previewRoot: els.orbTeleportPreviewRoot,
      orb: getElementById("orbTeleportLaneOrb"),
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
    }),
    getOrbBaseVisualState: buildCurrentLabOrbBaseVisualState,
    onOrbBaseVisualStateApplied: (visualState, previewActions) => {
      if (typeof defaults.onOrbBaseVisualStateApplied === "function") {
        defaults.onOrbBaseVisualStateApplied(visualState, previewActions);
      }
    },
    previewRootsByEffect,
    updateTeleportBehaviorReadout,
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
    if (!defaults.isCustomEffectOption(opt)) {
      applyCurrentEffectSettings(baseEffect, defaultSettingsForBaseEffect(baseEffect));
      return;
    }
    const profile = draftStore.profilesByValue[String(opt.value || "")];
    if (!profile) return;
    const profileBaseEffect = String(opt.dataset.baseEffect || profile.baseEffect || "");
    const settingsByBase = profile.settingsByBaseEffect && typeof profile.settingsByBaseEffect === "object"
      ? profile.settingsByBaseEffect
      : null;
    if (!settingsByBase) return;
    const settingsKey = settingsKeyForBaseEffect(profileBaseEffect);
    const settings = settingsByBase[settingsKey] || settingsByBase[profileBaseEffect];
    if (settings) applyCurrentEffectSettings(profileBaseEffect, settings);
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
      applyOrbBase: () => studioPreviewRegistry.actions.applyOrbBase(),
      applyOrbTemplate: () => studioPreviewRegistry.actions.applyOrbTemplate(),
      applyOrbNod: () => studioPreviewRegistry.actions.applyOrbNod(),
      applyOrbLifecycle: () => studioPreviewRegistry.actions.applyOrbLifecycle(),
      applyOrbGlobe: () => studioPreviewRegistry.actions.applyOrbGlobe(),
      applyWorldGlobe: () => studioPreviewRegistry.actions.applyWorldGlobe(),
      applyOrbTeleport: () => studioPreviewRegistry.actions.applyOrbTeleport(),
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
