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

function getBindingEntry(wordVfxBindings, wordId) {
  const normalized = String(wordId || "").trim().toLowerCase();
  return (Array.isArray(wordVfxBindings) ? wordVfxBindings : []).find((entry) => {
    const entryWordId = String((entry && (entry.wordId || entry.spellId)) || "").trim().toLowerCase();
    return entryWordId === normalized;
  }) || null;
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
    const selectedBinding = getBindingEntry(wordVfxBindings, selectedWordId);
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
    .map((b) => ({
      wordId: String((b.wordId || b.spellId || "")).toLowerCase(),
      spellId: String((b.wordId || b.spellId || "")).toLowerCase(),
      primary: b.primary || null,
      postCastActions: Array.isArray(b.postCastActions) ? b.postCastActions : [],
    }));

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

function quoteString(value) {
  return JSON.stringify(String(value || ""));
}

function serializeActionBinding(primary, indent) {
  return [
    `${indent}primary: Object.freeze({`,
    `${indent}  castActionId: ${quoteString(primary && primary.castActionId)},`,
    `${indent}  effectId: ${quoteString(primary && primary.effectId)},`,
    `${indent}  presetId: ${quoteString(primary && primary.presetId)},`,
    `${indent}}),`,
  ].join("\n");
}

function serializePostCastAction(action, indent) {
  const lines = [`${indent}Object.freeze({`, `${indent}  id: ${quoteString(action && action.id)},`];
  if (action && action.effectId) lines.push(`${indent}  effectId: ${quoteString(action.effectId)},`);
  if (action && action.presetId) lines.push(`${indent}  presetId: ${quoteString(action.presetId)},`);
  if (action && action.payload && typeof action.payload === "object" && Object.keys(action.payload).length) {
    lines.push(`${indent}  payload: Object.freeze(${JSON.stringify(action.payload)}),`);
  }
  lines.push(`${indent}})`);
  return lines.join("\n");
}

function serializeBindingEntry(entry) {
  const lines = [
    "  Object.freeze({",
    `    wordId: ${quoteString(entry && entry.wordId)},`,
    `    spellId: ${quoteString(entry && (entry.spellId || entry.wordId))},`,
    serializeActionBinding(entry && entry.primary, "    "),
  ];
  const postCastActions = Array.isArray(entry && entry.postCastActions) ? entry.postCastActions : [];
  if (postCastActions.length) {
    lines.push("    postCastActions: Object.freeze([");
    lines.push(postCastActions.map((action) => serializePostCastAction(action, "      ")).join(",\n"));
    lines.push("    ]),");
  }
  lines.push("  })");
  return lines.join("\n");
}

export function buildWordVfxBindingsModule(wordVfxBindings) {
  const entries = (Array.isArray(wordVfxBindings) ? wordVfxBindings : [])
    .map((entry) => ({
      ...entry,
      wordId: String((entry && (entry.wordId || entry.spellId)) || "").toLowerCase(),
      spellId: String((entry && (entry.wordId || entry.spellId)) || "").toLowerCase(),
      primary: entry && entry.primary ? { ...entry.primary } : null,
      postCastActions: Array.isArray(entry && entry.postCastActions)
        ? entry.postCastActions.map((action) => ({
            ...action,
            payload: action && action.payload && typeof action.payload === "object"
              ? { ...action.payload }
              : action && action.payload,
          }))
        : [],
    }))
    .filter((entry) => entry.wordId && entry.primary && entry.primary.castActionId && entry.primary.effectId && entry.primary.presetId)
    .sort((a, b) => a.wordId.localeCompare(b.wordId));

  return `// Word -> VFX binding schema (authoring/publish surface).
// Keeps word visual usage separate from word gameplay action routing.

/**
 * @typedef {Object} SpellVfxActionBinding
 * @property {string} castActionId Which action this VFX binding describes (for example \`aoe_flame\`).
 * @property {string} effectId VFX effect registry id.
 * @property {string} presetId Preset id to use for this action/effect.
 */

/**
 * @typedef {Object} SpellVfxPostActionBinding
 * @property {string} id Follow-up action id (for example \`float_grace\`).
 * @property {string} [effectId] Optional VFX effect registry id if the post action has a visual component.
 * @property {string} [presetId] Optional preset id for the post action VFX.
 * @property {Object} [payload] Optional action payload override (for example \`{ ms: 2500 }\`).
 */

/**
 * @typedef {Object} SpellVfxBindingEntry
 * @property {string} wordId Canonical word id.
 * @property {string} [spellId] Legacy compatibility alias for \`wordId\`.
 * @property {SpellVfxActionBinding} primary
 * @property {SpellVfxPostActionBinding[]} [postCastActions]
 */

/** @type {ReadonlyArray<Readonly<SpellVfxBindingEntry>>} */
export const WORD_VFX_BINDINGS = Object.freeze([
${entries.map((entry) => serializeBindingEntry(entry)).join(",\n")}
]);

export const WORD_VFX_BINDINGS_BY_WORD_ID = Object.freeze(
  WORD_VFX_BINDINGS.reduce((acc, entry) => {
    const wordId = String((entry && entry.wordId) || "").toLowerCase();
    if (!wordId) return acc;
    acc[wordId] = entry;
    return acc;
  }, {})
);

export function getWordVfxBinding(wordId) {
  return WORD_VFX_BINDINGS_BY_WORD_ID[String(wordId || "").toLowerCase()] || null;
}

// Legacy aliases preserved for older lab/runtime surfaces that still speak in
// spell-first terms while the repo converges on word-first naming.
export const SPELL_VFX_BINDINGS = WORD_VFX_BINDINGS;
export const SPELL_VFX_BINDINGS_BY_SPELL_ID = WORD_VFX_BINDINGS_BY_WORD_ID;

export function getSpellVfxBinding(spellId) {
  return getWordVfxBinding(spellId);
}
`;
}
