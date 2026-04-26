import { createLabAuthoringAdapters } from "../shell/lab-authoring-adapters.js";

export function createStudioAuthoringAdapters({
  factoriesByBaseEffect = {},
  context = {},
  previewApplyByBaseEffect = {},
  applyOptionsByBaseEffect = {},
} = {}) {
  const labAuthoringAdapters = createLabAuthoringAdapters({
    factoriesBySurface: factoriesByBaseEffect,
    context,
    previewApplyBySurface: previewApplyByBaseEffect,
    applyOptionsBySurface: applyOptionsByBaseEffect,
  });

  return Object.freeze({
    adaptersByBaseEffect: labAuthoringAdapters.adaptersBySurface,
    applyCurrentEffectSettings: (baseEffect, settings, els, options = {}) =>
      labAuthoringAdapters.applyCurrentSurfaceSettings(baseEffect, settings, els, options),
    authoringAdapterForBaseEffect: (baseEffect) =>
      labAuthoringAdapters.authoringAdapterForSurface(baseEffect),
    buildApplyOptions: (baseEffect) =>
      labAuthoringAdapters.buildApplyOptions(baseEffect),
    callAuthoringAdapter: (baseEffect, methodName, args = []) =>
      labAuthoringAdapters.callAuthoringAdapter(baseEffect, methodName, args),
    captureCurrentEffectSettings: (baseEffect, els, options = {}) =>
      labAuthoringAdapters.captureCurrentSurfaceSettings(baseEffect, els, options),
    defaultSettingsForBaseEffect: (baseEffect, {
      defaultSettingsKeyForBaseEffect = null,
      fallbackDefaultSettings = null,
    } = {}) => labAuthoringAdapters.defaultSettingsForSurface(baseEffect, {
      defaultSettingsKeyForSurface: defaultSettingsKeyForBaseEffect,
      fallbackDefaultSettings,
    }),
  });
}
