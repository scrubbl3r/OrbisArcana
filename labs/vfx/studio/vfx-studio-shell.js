export function refreshLockUi({
  lockEffectBtn,
  saveDraftBtn,
  publishPresetBtn,
  bindBtn,
  deleteEffectBtn,
  selectedEffectOption,
  isSelectedEffectLocked,
  isCoreEffectOption,
}) {
  if (!lockEffectBtn) return;
  const opt = selectedEffectOption();
  const locked = isSelectedEffectLocked();
  const _isCore = isCoreEffectOption(opt);
  void _isCore;
  lockEffectBtn.classList.toggle("locked", locked);
  lockEffectBtn.classList.toggle("unlocked", !locked);
  lockEffectBtn.setAttribute("aria-label", locked ? "Unlock effect profile" : "Lock effect profile");
  lockEffectBtn.title = locked ? "Unlock effect profile" : "Lock effect profile";
  lockEffectBtn.disabled = !opt || !!(opt && opt.disabled);

  const blockSave = locked;
  if (saveDraftBtn) saveDraftBtn.disabled = blockSave;
  if (publishPresetBtn) publishPresetBtn.disabled = blockSave;
  if (bindBtn) bindBtn.disabled = blockSave;
  if (deleteEffectBtn) deleteEffectBtn.disabled = blockSave || !!(opt && opt.disabled);
}

export function toggleSelectedEffectLock({
  selectedEffectOption,
  refreshLockUi,
  buildPresetDraftRecordFromSelection,
  draftStore,
  persistDraftStore,
  refreshBindingPanel,
}) {
  const opt = selectedEffectOption();
  if (!opt) return;
  if (opt.disabled) {
    refreshLockUi();
    return;
  }
  const nextLocked = !(String(opt.dataset.locked || "") === "true");
  opt.dataset.locked = nextLocked ? "true" : "false";
  const record = buildPresetDraftRecordFromSelection();
  if (record) {
    record.locked = nextLocked;
    draftStore.profilesByValue[String(record.value || "")] = record;
    draftStore.activeValue = String(record.value || "");
    persistDraftStore();
  }
  refreshLockUi();
  refreshBindingPanel();
}

export function refreshEffectMeta({ refreshBindingPanel, refreshLockUi }) {
  try {
    refreshBindingPanel();
  } catch (err) {
    console.error("refreshBindingPanel failed", err);
  }
  refreshLockUi();
}

export function updateEffectSections({
  selectedEffectOption,
  stopAllStudioEffects,
  lastSelectedEffectValueRef,
  selectedBaseEffect,
  draftStore,
  applyDraftToSelectedProfile,
  persistDraftStore,
  refreshEffectMeta,
  previewLayerGroups = {},
}) {
  const opt = selectedEffectOption();
  const selectedValue = String((opt && opt.value) || "");
  if (lastSelectedEffectValueRef.value && selectedValue && selectedValue !== lastSelectedEffectValueRef.value) {
    stopAllStudioEffects();
  }
  lastSelectedEffectValueRef.value = selectedValue;

  const effect = selectedBaseEffect();
  const sections = document.querySelectorAll(".section[data-effect]");
  sections.forEach((section) => {
    section.hidden = section.getAttribute("data-effect") !== effect;
  });

  const activeLayers = Array.isArray(previewLayerGroups[effect]) ? previewLayerGroups[effect] : [];
  const allLayers = new Set(
    Object.values(previewLayerGroups)
      .flat()
      .filter(Boolean)
  );
  allLayers.forEach((layer) => {
    if (!layer || typeof layer.toggleAttribute !== "function") return;
    const shouldShow = activeLayers.includes(layer);
    layer.toggleAttribute("hidden", !shouldShow);
    layer.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  });

  draftStore.activeValue = String((opt && opt.value) || "");
  applyDraftToSelectedProfile();
  persistDraftStore();
  refreshEffectMeta();
}

export function bootStudioShell({
  effectSelect,
  loadDraftStore,
  buildEffectLibraryOptionsFromRegistry,
  populateBindingWordOptions,
  setDraftHydrationDone,
  updateEffectSections,
  newEffectBtn,
  createCustomEffectProfile,
  saveDraftBtn,
  saveDraft,
  connectProjectBtn,
  connectProjectFolder,
  publishPresetBtn,
  publishPreset,
  bindBtn,
  publishBinding,
  bindingWordSelect,
  refreshBindingPanel,
  renameEffectBtn,
  renameEffectProfile,
  duplicateEffectBtn,
  duplicateEffectProfile,
  deleteEffectBtn,
  deleteEffectProfile,
  lockEffectBtn,
  toggleSelectedEffectLock,
  refreshProjectConnectUi,
  refreshLockUi,
}) {
  if (effectSelect) {
    loadDraftStore();
    buildEffectLibraryOptionsFromRegistry();
    populateBindingWordOptions();
    setDraftHydrationDone(true);
    effectSelect.addEventListener("change", updateEffectSections);
    try {
      updateEffectSections();
    } catch (err) {
      console.error("updateEffectSections init failed", err);
    }
  }
  if (newEffectBtn) newEffectBtn.addEventListener("click", createCustomEffectProfile);
  if (saveDraftBtn) saveDraftBtn.addEventListener("click", saveDraft);
  if (connectProjectBtn) connectProjectBtn.addEventListener("click", () => { void connectProjectFolder(); });
  if (publishPresetBtn) publishPresetBtn.addEventListener("click", publishPreset);
  if (bindBtn) bindBtn.addEventListener("click", publishBinding);
  if (bindingWordSelect) bindingWordSelect.addEventListener("change", refreshBindingPanel);
  if (renameEffectBtn) renameEffectBtn.addEventListener("click", renameEffectProfile);
  if (duplicateEffectBtn) duplicateEffectBtn.addEventListener("click", duplicateEffectProfile);
  if (deleteEffectBtn) deleteEffectBtn.addEventListener("click", deleteEffectProfile);
  if (lockEffectBtn) lockEffectBtn.addEventListener("click", toggleSelectedEffectLock);
  refreshProjectConnectUi();
  refreshLockUi();
}
