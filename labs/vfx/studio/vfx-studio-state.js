export function createDraftStore() {
  return {
    profilesByValue: Object.create(null),
    activeValue: "",
  };
}

export function selectedEffectOption(effectSelect) {
  if (!effectSelect) return null;
  const idx = effectSelect.selectedIndex;
  return idx >= 0 ? effectSelect.options[idx] : null;
}

export function listEffectOptions(effectSelect) {
  return effectSelect ? Array.from(effectSelect.options) : [];
}

export function findEffectOptionByValue(effectSelect, value) {
  return listEffectOptions(effectSelect).find((o) => o.value === value) || null;
}

export function loadDraftStore(storageKey, draftStore) {
  let parsed = null;
  try {
    parsed = JSON.parse(window.localStorage.getItem(storageKey) || "null");
  } catch (_err) {
    parsed = null;
  }
  const profiles = parsed && typeof parsed === "object" && parsed.profilesByValue && typeof parsed.profilesByValue === "object"
    ? parsed.profilesByValue
    : {};
  for (const [value, profile] of Object.entries(profiles)) {
    if (!profile || typeof profile !== "object") continue;
    const resolvedValue = String(profile.value || value);
    let resolvedBaseEffect = String(profile.baseEffect || "bubble-shield");
    const resolvedLabel = String(profile.label || value);
    const duplicateBuiltinOrb = resolvedValue.startsWith("custom:")
      && (
        (resolvedBaseEffect === "orb-nod" && slugifyEffectName(resolvedLabel) === "orb-nod")
        || (resolvedBaseEffect === "orb-lifecycle" && slugifyEffectName(resolvedLabel) === "orb-lifecycle")
      );
    if (duplicateBuiltinOrb) continue;
    const lifecycleLike = resolvedValue.startsWith("custom:")
      && resolvedBaseEffect === "orb-template"
      && (
        resolvedValue.startsWith("custom:orb-lifecycle:")
        || /:lifecycle(?:-\d+)?$/i.test(resolvedValue)
      );
    if (lifecycleLike) {
      resolvedBaseEffect = "orb-lifecycle";
    }
    const isTemplateClone = resolvedValue.startsWith("custom:") && resolvedBaseEffect === "orb-template";
    const settingsByBaseEffect = profile.settingsByBaseEffect && typeof profile.settingsByBaseEffect === "object"
      ? { ...profile.settingsByBaseEffect }
      : {};
    if (lifecycleLike && settingsByBaseEffect["orb-template"] && !settingsByBaseEffect["orb-lifecycle"]) {
      const prev = settingsByBaseEffect["orb-template"];
      settingsByBaseEffect["orb-lifecycle"] = {
        orbLifecycleShardTotal: Number(prev.orbTemplateShardTotal) || 16,
        orbLifecycleHitTotal: Number(prev.orbTemplateHitTotal) || 3,
      };
    }
    draftStore.profilesByValue[value] = {
      value: resolvedValue,
      label: resolvedLabel,
      baseEffect: resolvedBaseEffect,
      category: String(profile.category || "spell"),
      registryId: String(profile.registryId || ""),
      locked: isTemplateClone ? false : !!profile.locked,
      settingsByBaseEffect,
      savedAtMs: Number(profile.savedAtMs) || Date.now(),
    };
  }
  draftStore.activeValue = parsed && typeof parsed.activeValue === "string" ? parsed.activeValue : "";
}

export function persistDraftStore(storageKey, draftStore) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({
      profilesByValue: draftStore.profilesByValue,
      activeValue: draftStore.activeValue || "",
    }));
  } catch (_err) {
    // Ignore localStorage write failures.
  }
}

export function ensureCategoryGroup(effectSelect, categoryLabels, category) {
  if (!effectSelect) return null;
  const key = String(category || "spell");
  let group = effectSelect.querySelector(`optgroup[data-category="${key}"]`);
  if (group) return group;
  group = document.createElement("optgroup");
  group.label = categoryLabels[key] || key;
  group.dataset.kind = "builtin";
  group.dataset.category = key;
  effectSelect.appendChild(group);
  return group;
}

export function restoreDraftProfilesIntoSelect({
  effectSelect,
  draftStore,
  categoryLabels,
}) {
  if (!effectSelect) return;
  for (const profile of Object.values(draftStore.profilesByValue)) {
    if (!profile || typeof profile !== "object") continue;
    const value = String(profile.value || "");
    if (!value || !value.startsWith("custom:")) continue;
    if (findEffectOptionByValue(effectSelect, value)) continue;
    const category = String(profile.category || "spell");
    const targetGroup = ensureCategoryGroup(effectSelect, categoryLabels, category);
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = String(profile.label || value);
    opt.dataset.baseEffect = String(profile.baseEffect || "bubble-shield");
    opt.dataset.spawnBaseEffect = String(profile.baseEffect || "bubble-shield");
    opt.dataset.category = category;
    opt.dataset.custom = "true";
    opt.dataset.locked = profile.locked ? "true" : "false";
    if (profile.registryId) opt.dataset.registryId = String(profile.registryId);
    targetGroup.appendChild(opt);
  }
}

export function buildEffectLibraryOptionsFromRegistry({
  effectSelect,
  draftStore,
  registry,
  baseEffectByRegistryId,
  categoryLabels,
  extraBuiltinOptions = [],
  omitRegistryIds = [],
}) {
  if (!effectSelect) return;
  const previousValue = draftStore.activeValue || effectSelect.value;
  const customOptions = Array.from(effectSelect.querySelectorAll('option[data-custom="true"]'))
    .map((o) => o.cloneNode(true));
  effectSelect.innerHTML = "";

  const omitted = new Set((Array.isArray(omitRegistryIds) ? omitRegistryIds : []).map((id) => String(id || "")));
  const groups = new Map();
  for (const entry of Array.isArray(registry) ? registry : []) {
    if (!entry) continue;
    if (omitted.has(String(entry.id || ""))) continue;
    const category = String(entry.category || "spell");
    if (!groups.has(category)) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = categoryLabels[category] || category;
      optgroup.dataset.kind = "builtin";
      optgroup.dataset.category = category;
      groups.set(category, optgroup);
    }
    const opt = document.createElement("option");
    const effectId = String(entry.id || "");
    const baseEffect = baseEffectByRegistryId[effectId] || "";
    if (!baseEffect) continue;
    opt.value = baseEffect || `registry:${effectId}`;
    opt.textContent = String(entry.label || effectId || "effect");
    opt.dataset.registryId = effectId;
    opt.dataset.baseEffect = baseEffect;
    opt.dataset.spawnBaseEffect = baseEffect;
    opt.dataset.category = category;
    opt.dataset.locked = "true";
    groups.get(category).appendChild(opt);
  }

  for (const category of ["spell", "orb", "world", "enemy"]) {
    const group = groups.get(category);
    if (group && group.children.length) effectSelect.appendChild(group);
  }

  const extraOptions = Array.isArray(extraBuiltinOptions) ? extraBuiltinOptions.slice() : [];
  for (const optionDef of extraOptions.slice().reverse()) {
    if (!optionDef || typeof optionDef !== "object") continue;
    const category = String(optionDef.category || "orb");
    const targetGroup = ensureCategoryGroup(effectSelect, categoryLabels, category);
    const opt = document.createElement("option");
    opt.value = String(optionDef.value || "");
    opt.textContent = String(optionDef.label || optionDef.value || "effect");
    opt.dataset.baseEffect = String(optionDef.baseEffect || optionDef.value || "");
    opt.dataset.spawnBaseEffect = String(optionDef.spawnBaseEffect || optionDef.baseEffect || optionDef.value || "");
    opt.dataset.category = category;
    opt.dataset.locked = String(optionDef.locked ? "true" : "false");
    if (category === "orb" && targetGroup.firstChild) {
      targetGroup.insertBefore(opt, targetGroup.firstChild);
    } else {
      targetGroup.appendChild(opt);
    }
  }

  for (const opt of customOptions) {
    const category = String(opt.dataset.category || "spell");
    ensureCategoryGroup(effectSelect, categoryLabels, category).appendChild(opt);
  }

  restoreDraftProfilesIntoSelect({ effectSelect, draftStore, categoryLabels });

  const hasValue = (value) => Array.from(effectSelect.options).some((o) => o.value === value && !o.disabled);
  if (previousValue && hasValue(previousValue)) {
    effectSelect.value = previousValue;
  } else if (hasValue("bubble-shield")) {
    effectSelect.value = "bubble-shield";
  } else {
    const firstEnabled = Array.from(effectSelect.options).find((o) => !o.disabled);
    if (firstEnabled) effectSelect.value = firstEnabled.value;
  }

}

export function selectedBaseEffect(opt) {
  if (!opt) return "bubble-shield";
  return String(opt.dataset.baseEffect || opt.value || "bubble-shield");
}

export function selectedSpawnBaseEffect(opt) {
  if (!opt) return "bubble-shield";
  return String(opt.dataset.spawnBaseEffect || opt.dataset.baseEffect || opt.value || "bubble-shield");
}

export function selectedEffectCategory(opt) {
  if (!opt) return "spell";
  if (opt.dataset.category) return String(opt.dataset.category);
  const parent = opt.parentElement;
  if (parent && parent.tagName === "OPTGROUP" && parent.dataset.category) {
    return String(parent.dataset.category);
  }
  return "spell";
}

export function isSelectedEffectLocked(opt) {
  if (!opt) return false;
  return String(opt.dataset.locked || "") === "true";
}

export function isCustomEffectOption(opt) {
  if (!opt) return false;
  return String(opt.dataset.custom || "") === "true" || String(opt.value || "").startsWith("custom:");
}

export function isCoreEffectOption(opt) {
  return !!opt && !isCustomEffectOption(opt);
}

export function slugifyEffectName(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function nextCustomEffectValue(effectSelect, baseEffect, name) {
  const base = slugifyEffectName(baseEffect) || "effect";
  const slug = slugifyEffectName(name) || "custom";
  let i = 1;
  let value = `custom:${base}:${slug}`;
  if (!effectSelect) return value;
  const exists = () => Array.from(effectSelect.options).some((o) => o.value === value);
  while (exists()) {
    i += 1;
    value = `custom:${base}:${slug}-${i}`;
  }
  return value;
}

export function buildPresetDraftRecordFromSelection({
  opt,
  draftStore,
  baseEffect,
  category,
  captureCurrentEffectSettings,
}) {
  if (!opt) return null;
  const value = String(opt.value || "");
  if (!value) return null;
  const prev = draftStore.profilesByValue[value] || {};
  return {
    value,
    label: String(opt.textContent || value),
    baseEffect,
    category,
    registryId: String(opt.dataset.registryId || prev.registryId || ""),
    locked: String(opt.dataset.locked || "") === "true",
    settingsByBaseEffect: {
      ...(prev.settingsByBaseEffect && typeof prev.settingsByBaseEffect === "object" ? prev.settingsByBaseEffect : {}),
      [baseEffect]: captureCurrentEffectSettings(baseEffect),
    },
    savedAtMs: Date.now(),
  };
}

export function upsertCurrentDraftProfile({
  draftStore,
  record,
  persistDraftStore,
}) {
  if (!record) return null;
  draftStore.profilesByValue[record.value] = record;
  draftStore.activeValue = record.value;
  persistDraftStore();
  return record;
}

export function createCustomEffectProfile({
  effectSelect,
  selectedOption,
  baseEffect,
  category,
  trimmedName,
  draftStore,
  categoryLabels,
  defaultSettings,
  updateEffectSections,
  persistDraftStore,
}) {
  const opt = document.createElement("option");
  const newValue = nextCustomEffectValue(effectSelect, baseEffect, trimmedName);
  opt.value = newValue;
  opt.dataset.baseEffect = baseEffect;
  opt.dataset.spawnBaseEffect = baseEffect;
  opt.dataset.category = category;
  opt.dataset.custom = "true";
  if (selectedOption && selectedOption.dataset.registryId) opt.dataset.registryId = String(selectedOption.dataset.registryId);
  opt.textContent = trimmedName;
  ensureCategoryGroup(effectSelect, categoryLabels, category)?.appendChild(opt);

  draftStore.profilesByValue[newValue] = {
    value: newValue,
    label: trimmedName,
    baseEffect,
    category,
    registryId: String((selectedOption && selectedOption.dataset.registryId) || ""),
    locked: false,
    settingsByBaseEffect: {
      [baseEffect]: defaultSettings,
    },
    savedAtMs: Date.now(),
  };
  draftStore.activeValue = newValue;
  persistDraftStore();
  effectSelect.value = opt.value;
  updateEffectSections();
}

export function duplicateEffectProfile({
  effectSelect,
  selectedOption,
  baseEffect,
  category,
  trimmedName,
  draftStore,
  categoryLabels,
  captureCurrentEffectSettings,
  defaultSettingsForBaseEffect = null,
  updateEffectSections,
  persistDraftStore,
}) {
  const newValue = nextCustomEffectValue(effectSelect, baseEffect, trimmedName);
  const opt = document.createElement("option");
  opt.value = newValue;
  opt.dataset.baseEffect = baseEffect;
  opt.dataset.spawnBaseEffect = baseEffect;
  opt.dataset.category = category;
  opt.dataset.custom = "true";
  if (selectedOption && selectedOption.dataset.registryId) opt.dataset.registryId = String(selectedOption.dataset.registryId);
  opt.textContent = trimmedName;
  ensureCategoryGroup(effectSelect, categoryLabels, category)?.appendChild(opt);

  const srcValue = String((selectedOption && selectedOption.value) || "");
  const srcDraft = draftStore.profilesByValue[srcValue];
  const srcSettingsByBase = srcDraft && srcDraft.settingsByBaseEffect && typeof srcDraft.settingsByBaseEffect === "object"
    ? srcDraft.settingsByBaseEffect
    : null;
  const isLockedBuiltinTemplate = (
    String(baseEffect || "") === "orb-template"
    && String((selectedOption && selectedOption.dataset.locked) || "") === "true"
    && typeof defaultSettingsForBaseEffect === "function"
  );
  draftStore.profilesByValue[newValue] = {
    value: newValue,
    label: trimmedName,
    baseEffect,
    category,
    registryId: String((selectedOption && selectedOption.dataset.registryId) || ""),
    locked: false,
    settingsByBaseEffect: srcSettingsByBase
      ? JSON.parse(JSON.stringify(srcSettingsByBase))
      : isLockedBuiltinTemplate
      ? { [baseEffect]: defaultSettingsForBaseEffect(baseEffect) }
      : { [baseEffect]: captureCurrentEffectSettings(baseEffect) },
    savedAtMs: Date.now(),
  };
  draftStore.activeValue = newValue;
  persistDraftStore();
  effectSelect.value = newValue;
  updateEffectSections();
}

export function renameEffectProfile({ opt, trimmedName, draftStore, persistDraftStore }) {
  if (!opt) return;
  opt.textContent = trimmedName;
  const profile = draftStore.profilesByValue[String(opt.value || "")];
  if (profile) {
    profile.label = trimmedName;
    persistDraftStore();
  }
}

export function deleteEffectProfile({
  opt,
  effectSelect,
  draftStore,
  persistDraftStore,
  updateEffectSections,
}) {
  if (!opt || !effectSelect) return;
  delete draftStore.profilesByValue[String(opt.value || "")];
  const fallback = Array.from(effectSelect.options).find((o) => String(o.dataset.locked || "") === "true") || effectSelect.options[0];
  opt.remove();
  if (fallback) effectSelect.value = fallback.value;
  draftStore.activeValue = String((fallback && fallback.value) || "");
  persistDraftStore();
  updateEffectSections();
}
