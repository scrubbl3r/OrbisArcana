export function setBindingRows(bindingGrid, rows) {
  if (!bindingGrid) return;
  bindingGrid.innerHTML = "";
  for (const row of (Array.isArray(rows) ? rows : [])) {
    const k = document.createElement("div");
    k.className = "k";
    k.textContent = String((row && row.k) || "");
    const v = document.createElement("div");
    v.className = "v";
    v.textContent = String((row && row.v) || "");
    bindingGrid.appendChild(k);
    bindingGrid.appendChild(v);
  }
}

export function refreshBindingPanel({
  bindingGrid,
  bindingWordSelect,
  selectedEffectOption,
  selectedEffectCategory,
  getRuntimeWordById,
  resolveSpellVfxBinding,
  wordVfxBindings,
}) {
  const opt = selectedEffectOption();
  if (!opt) return;
  const registryId = String(opt.dataset.registryId || "");
  const isCustom = String(opt.value || "").startsWith("custom:");
  const selectedWordId = String((bindingWordSelect && bindingWordSelect.value) || "").trim().toLowerCase();
  const selectedRuntimeWord = selectedWordId ? getRuntimeWordById(selectedWordId) : null;

  if (isCustom) {
    setBindingRows(bindingGrid, [
      { k: "Scope", v: `Custom profile (local ${selectedEffectCategory()})` },
      { k: "Base", v: String(opt.dataset.baseEffect || "unknown") },
      { k: "Binding", v: "Not published yet" },
    ]);
    return;
  }

  if (!registryId) {
    setBindingRows(bindingGrid, [
      { k: "Binding", v: "No registry effect selected" },
    ]);
    return;
  }

  if (selectedRuntimeWord && registryId) {
    const selectedBinding = resolveSpellVfxBinding(selectedWordId);
    const selectedPrimary = selectedBinding && selectedBinding.primary ? selectedBinding.primary : null;
    const selectedEffectId = String((selectedPrimary && selectedPrimary.effectId) || "");
    const selectedPresetId = String((selectedPrimary && selectedPrimary.presetId) || "");
    setBindingRows(bindingGrid, [
      { k: "Selected word", v: selectedWordId },
      { k: "Cast action", v: String(selectedRuntimeWord.castActionId || "unknown") },
      { k: "Current effect", v: selectedEffectId || "No published binding yet" },
      { k: "Current preset", v: selectedPresetId || "Will use selected/default preset" },
      { k: "Selected effect", v: registryId },
      { k: "Publish target", v: "src/content/vfx/spell-effect-bindings.js" },
    ]);
    return;
  }

  const matches = (Array.isArray(wordVfxBindings) ? wordVfxBindings : [])
    .filter((b) => b && b.primary && String(b.primary.effectId || "") === registryId)
    .map((b) => resolveSpellVfxBinding(String((b.wordId || b.spellId || ""))))
    .filter(Boolean);

  if (!matches.length) {
    setBindingRows(bindingGrid, [
      { k: "Effect ID", v: registryId },
      { k: "Bindings", v: "No spell binding yet (or non-spell effect)" },
      { k: "Status", v: opt.disabled ? "Preview scene coming soon" : "Preset-only / unbound" },
    ]);
    return;
  }

  const first = matches[0];
  const primary = first && first.primary ? first.primary : null;
  const effect = primary && primary.effect ? primary.effect : null;
  const postCast = Array.isArray(first.postCastActions) ? first.postCastActions : [];
  const postCastText = postCast.length
    ? postCast.map((a) => {
        const ms = a && a.payload && a.payload.ms != null ? ` (${a.payload.ms}ms)` : "";
        return `${String(a && a.id || "action")}${ms}`;
      }).join(", ")
    : "none";

  setBindingRows(bindingGrid, [
    { k: "Effect ID", v: registryId },
    { k: "Bound spells", v: matches.map((m) => m.spellId).join(", ") },
    { k: "Preset", v: String((primary && primary.presetId) || "unknown") },
    { k: "Cast action", v: String((primary && primary.castActionId) || "unknown") },
    { k: "Publish", v: effect && Array.isArray(effect.publishTargets) ? effect.publishTargets.join(", ") : "preset" },
    { k: "Post-cast", v: postCastText },
  ]);
}

export function populateBindingWordOptions(bindingWordSelect, runtimeWords) {
  if (!bindingWordSelect) return;
  const previousValue = String(bindingWordSelect.value || "").trim().toLowerCase();
  const words = Array.isArray(runtimeWords) ? runtimeWords : [];
  bindingWordSelect.innerHTML = "";
  for (const word of words) {
    const wordId = String(word && word.id || "").trim().toLowerCase();
    if (!wordId) continue;
    const opt = document.createElement("option");
    opt.value = wordId;
    opt.textContent = `${wordId} (${String(word.castActionId || wordId)})`;
    bindingWordSelect.appendChild(opt);
  }
  if (previousValue && Array.from(bindingWordSelect.options).some((opt) => opt.value === previousValue)) {
    bindingWordSelect.value = previousValue;
  }
}
