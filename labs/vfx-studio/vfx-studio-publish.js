export function sanitizePresetIdPart(text, fallback = "preset", slugifyEffectName) {
  const slug = typeof slugifyEffectName === "function" ? slugifyEffectName(text) : "";
  return slug || fallback;
}

export function derivePublishedEffectIdentity({
  opt,
  record,
  profileName,
  baseEffect,
  slugifyEffectName,
}) {
  const authoringBaseEffect = String(baseEffect || "unknown");
  const isCustomProfile = !!(opt && (String(opt.dataset?.custom || "") === "true" || String(opt.value || "").startsWith("custom:")));
  if (isCustomProfile && authoringBaseEffect === "orb-template") {
    const stateSlug = sanitizePresetIdPart(profileName, "orb-state", slugifyEffectName);
    return {
      authoringBaseEffect,
      publishedBaseEffect: `orb-${stateSlug}`,
      publishedEffectId: `orb-${stateSlug}`,
    };
  }
  return {
    authoringBaseEffect,
    publishedBaseEffect: authoringBaseEffect,
    publishedEffectId: String((record && record.registryId) || "").trim() || null,
  };
}

export function buildPublishedPresetPayload({
  opt,
  record,
  selectedBaseEffect,
  settingsKeyForBaseEffect,
  captureCurrentEffectSettings,
  registryEntries,
  slugifyEffectName,
} = {}) {
  if (!opt || !record) return null;
  const profileName = String(record.label || record.value || "effect");
  const baseEffect = String(record.baseEffect || selectedBaseEffect || "unknown");
  const registryId = String(record.registryId || "");
  const publishedIdentity = derivePublishedEffectIdentity({
    opt,
    record,
    profileName,
    baseEffect,
    slugifyEffectName,
  });
  const publishedBaseEffect = String(publishedIdentity.publishedBaseEffect || baseEffect || "unknown");
  const settingsKey = typeof settingsKeyForBaseEffect === "function" ? settingsKeyForBaseEffect(baseEffect) : baseEffect;
  const settings = record.settingsByBaseEffect && (record.settingsByBaseEffect[settingsKey] || record.settingsByBaseEffect[baseEffect])
    ? record.settingsByBaseEffect[settingsKey] || record.settingsByBaseEffect[baseEffect]
    : (typeof captureCurrentEffectSettings === "function" ? captureCurrentEffectSettings(baseEffect) : {});
  const registryEntry = (Array.isArray(registryEntries) ? registryEntries : [])
    .find((entry) => String((entry && entry.id) || "") === registryId) || null;
  const generatedPresetId = registryId
    ? `preset.${sanitizePresetIdPart(registryId.replace(/\./g, "-"), "effect", slugifyEffectName)}.${sanitizePresetIdPart(profileName, "custom", slugifyEffectName)}`
    : `preset.${sanitizePresetIdPart(publishedBaseEffect, "effect", slugifyEffectName)}.${sanitizePresetIdPart(profileName, "custom", slugifyEffectName)}`;

  return {
    filename: `${sanitizePresetIdPart(publishedBaseEffect, "effect", slugifyEffectName)}--${sanitizePresetIdPart(profileName, "preset", slugifyEffectName)}.preset.json`,
    payload: {
      kind: "orbis-arcana.vfx-preset-draft",
      version: 1,
      profileName,
      profileValue: String(record.value || ""),
      effectId: registryId || publishedIdentity.publishedEffectId || null,
      baseEffect: publishedBaseEffect,
      presetId: generatedPresetId,
      params: settings || {},
      source: {
        studio: "vfx-studio.html",
        selectionLabel: String(opt.textContent || profileName),
        authoringBaseEffect: String(publishedIdentity.authoringBaseEffect || baseEffect || ""),
        settingsKey,
        registryDefaultPresetId: registryEntry ? String(registryEntry.defaultPresetId || "") : "",
      },
      savedAtMs: Number(record.savedAtMs) || Date.now(),
      exportedAtMs: Date.now(),
    },
  };
}

export function describePublishedPath(pathParts) {
  return Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts || "");
}

export function describePublishSuccess({ publishedPaths = [], contract = null } = {}) {
  const paths = Array.isArray(publishedPaths) ? publishedPaths.filter(Boolean) : [];
  if (!paths.length) return "Published.";
  if (contract && contract.livePreset && contract.behavior && paths.length >= 2) {
    return `Published live preset and behavior to ${paths.map(describePublishedPath).join(" + ")}`;
  }
  if (contract && contract.livePreset) {
    return `Published live preset to ${describePublishedPath(paths[0])}`;
  }
  if (contract && contract.behavior) {
    return `Published behavior to ${describePublishedPath(paths[0])}`;
  }
  return `Published to ${paths.map(describePublishedPath).join(" + ")}`;
}

export function replaceRuntimeBindingEntry(runtimeEffectBindings, nextEntry) {
  const nextKind = String((nextEntry && nextEntry.targetKind) || "").trim().toLowerCase();
  const nextId = String((nextEntry && nextEntry.targetId) || "").trim().toLowerCase();
  const otherEntries = (Array.isArray(runtimeEffectBindings) ? runtimeEffectBindings : []).filter((entry) => {
    const entryKind = String((entry && entry.targetKind) || "").trim().toLowerCase();
    const entryId = String((entry && entry.targetId) || "").trim().toLowerCase();
    return !(entryKind === nextKind && entryId === nextId);
  });
  return [...otherEntries, nextEntry];
}

export const RUNTIME_BINDINGS_TARGET_PATH = Object.freeze(["src", "content", "vfx", "runtime-effect-bindings.js"]);

export function findRegistryEntry(registryEntries, registryId) {
  return (Array.isArray(registryEntries) ? registryEntries : [])
    .find((entry) => String((entry && entry.id) || "") === String(registryId || "")) || null;
}

export function supportsBindingPublish(registryEntry) {
  return !!(registryEntry
    && Array.isArray(registryEntry.publishTargets)
    && registryEntry.publishTargets.includes("binding"));
}

export function buildRuntimeBindingEntry({ runtimeTarget, registryId, builtPayload, registryEntry } = {}) {
  return {
    targetKind: String((runtimeTarget && runtimeTarget.targetKind) || ""),
    targetId: String((runtimeTarget && runtimeTarget.targetId) || ""),
    effectId: String(registryId || ""),
    presetId: String((builtPayload && builtPayload.payload && builtPayload.payload.presetId) || (registryEntry && registryEntry.defaultPresetId) || ""),
  };
}

export function buildBindingPublishPlan({
  runtimeEffectBindings,
  runtimeTarget,
  registryId,
  builtPayload,
  registryEntry,
  buildRuntimeEffectBindingsModule,
} = {}) {
  const nextEntry = buildRuntimeBindingEntry({ runtimeTarget, registryId, builtPayload, registryEntry });
  const nextBindings = replaceRuntimeBindingEntry(runtimeEffectBindings, nextEntry);
  return {
    nextEntry,
    nextBindings,
    targetPath: RUNTIME_BINDINGS_TARGET_PATH,
    moduleText: typeof buildRuntimeEffectBindingsModule === "function"
      ? buildRuntimeEffectBindingsModule(nextBindings)
      : "",
  };
}

export function collectBindingsForPresetId(runtimeEffectBindings, presetId) {
  const matchPresetId = String(presetId || "").trim();
  if (!matchPresetId) return [];
  return (Array.isArray(runtimeEffectBindings) ? runtimeEffectBindings : []).filter((entry) => {
    const bindingPresetId = String((entry && entry.presetId) || "").trim();
    return bindingPresetId === matchPresetId;
  });
}

export function buildBindingCleanupPlan({
  runtimeEffectBindings,
  affectedBindings,
  buildRuntimeEffectBindingsModule,
} = {}) {
  const removalSet = new Set(Array.isArray(affectedBindings) ? affectedBindings : []);
  const remainingBindings = (Array.isArray(runtimeEffectBindings) ? runtimeEffectBindings : [])
    .filter((entry) => !removalSet.has(entry));
  return {
    remainingBindings,
    targetPath: RUNTIME_BINDINGS_TARGET_PATH,
    moduleText: typeof buildRuntimeEffectBindingsModule === "function"
      ? buildRuntimeEffectBindingsModule(remainingBindings)
      : "",
  };
}
