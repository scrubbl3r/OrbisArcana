export function createStudioAuthoringAdapters({
  factoriesByBaseEffect = {},
  context = {},
  previewApplyByBaseEffect = {},
  applyOptionsByBaseEffect = {},
} = {}) {
  const adaptersByBaseEffect = Object.freeze(
    Object.fromEntries(
      Object.entries(factoriesByBaseEffect).map(([baseEffect, createAdapter]) => [
        baseEffect,
        typeof createAdapter === "function" ? createAdapter(context) : null,
      ])
    )
  );

  function authoringAdapterForBaseEffect(baseEffect) {
    return adaptersByBaseEffect[String(baseEffect || "")] || null;
  }

  function callAuthoringAdapter(baseEffect, methodName, args = []) {
    const adapter = authoringAdapterForBaseEffect(baseEffect);
    const method = adapter && adapter[methodName];
    return typeof method === "function" ? method(...args) : undefined;
  }

  function buildApplyOptions(baseEffect) {
    const extraOptions = applyOptionsByBaseEffect[String(baseEffect || "")];
    return {
      ...(extraOptions && typeof extraOptions === "object" ? extraOptions : {}),
      applyPreview: () => {
        const applyPreview = previewApplyByBaseEffect[String(baseEffect || "")];
        if (typeof applyPreview === "function") applyPreview();
      },
    };
  }

  function defaultSettingsForBaseEffect(baseEffect, {
    defaultSettingsKeyForBaseEffect = null,
    fallbackDefaultSettings = null,
  } = {}) {
    const key = typeof defaultSettingsKeyForBaseEffect === "function"
      ? defaultSettingsKeyForBaseEffect(baseEffect)
      : String(baseEffect || "");
    const adapterDefaults = callAuthoringAdapter(key, "defaultSettings");
    if (adapterDefaults !== undefined) return adapterDefaults;
    return typeof fallbackDefaultSettings === "function" ? fallbackDefaultSettings(key, baseEffect) : {};
  }

  function captureCurrentEffectSettings(baseEffect, els, {
    fallbackCapture = null,
  } = {}) {
    const adapterSettings = callAuthoringAdapter(baseEffect, "capture", [els]);
    if (adapterSettings !== undefined) return adapterSettings;
    return typeof fallbackCapture === "function" ? fallbackCapture(baseEffect, els) : {};
  }

  function applyCurrentEffectSettings(baseEffect, settings, els, {
    fallbackApply = null,
  } = {}) {
    if (!settings || typeof settings !== "object") return;
    if (callAuthoringAdapter(baseEffect, "apply", [els, settings, buildApplyOptions(baseEffect)]) !== undefined) {
      return;
    }
    if (typeof fallbackApply === "function") fallbackApply(baseEffect, settings, els);
  }

  return Object.freeze({
    adaptersByBaseEffect,
    applyCurrentEffectSettings,
    authoringAdapterForBaseEffect,
    buildApplyOptions,
    callAuthoringAdapter,
    captureCurrentEffectSettings,
    defaultSettingsForBaseEffect,
  });
}
