export function createLabAuthoringAdapters({
  factoriesBySurface = {},
  context = {},
  previewApplyBySurface = {},
  applyOptionsBySurface = {},
} = {}) {
  const adaptersBySurface = Object.freeze(
    Object.fromEntries(
      Object.entries(factoriesBySurface).map(([surfaceId, createAdapter]) => [
        surfaceId,
        typeof createAdapter === "function" ? createAdapter(context) : null,
      ])
    )
  );

  function authoringAdapterForSurface(surfaceId) {
    return adaptersBySurface[String(surfaceId || "")] || null;
  }

  function callAuthoringAdapter(surfaceId, methodName, args = []) {
    const adapter = authoringAdapterForSurface(surfaceId);
    const method = adapter && adapter[methodName];
    return typeof method === "function" ? method(...args) : undefined;
  }

  function buildApplyOptions(surfaceId) {
    const extraOptions = applyOptionsBySurface[String(surfaceId || "")];
    return {
      ...(extraOptions && typeof extraOptions === "object" ? extraOptions : {}),
      applyPreview: () => {
        const applyPreview = previewApplyBySurface[String(surfaceId || "")];
        if (typeof applyPreview === "function") applyPreview();
      },
    };
  }

  function defaultSettingsForSurface(surfaceId, {
    defaultSettingsKeyForSurface = null,
    fallbackDefaultSettings = null,
  } = {}) {
    const key = typeof defaultSettingsKeyForSurface === "function"
      ? defaultSettingsKeyForSurface(surfaceId)
      : String(surfaceId || "");
    const adapterDefaults = callAuthoringAdapter(key, "defaultSettings");
    if (adapterDefaults !== undefined) return adapterDefaults;
    return typeof fallbackDefaultSettings === "function" ? fallbackDefaultSettings(key, surfaceId) : {};
  }

  function captureCurrentSurfaceSettings(surfaceId, refs, {
    fallbackCapture = null,
  } = {}) {
    const adapterSettings = callAuthoringAdapter(surfaceId, "capture", [refs]);
    if (adapterSettings !== undefined) return adapterSettings;
    return typeof fallbackCapture === "function" ? fallbackCapture(surfaceId, refs) : {};
  }

  function applyCurrentSurfaceSettings(surfaceId, settings, refs, {
    fallbackApply = null,
  } = {}) {
    if (!settings || typeof settings !== "object") return;
    if (callAuthoringAdapter(surfaceId, "apply", [refs, settings, buildApplyOptions(surfaceId)]) !== undefined) {
      return;
    }
    if (typeof fallbackApply === "function") fallbackApply(surfaceId, settings, refs);
  }

  return Object.freeze({
    adaptersBySurface,
    applyCurrentSurfaceSettings,
    authoringAdapterForSurface,
    buildApplyOptions,
    callAuthoringAdapter,
    captureCurrentSurfaceSettings,
    defaultSettingsForSurface,
  });
}
