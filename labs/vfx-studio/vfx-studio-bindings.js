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

function getBindingEntry(runtimeEffectBindings, targetKind, targetId) {
  const kind = String(targetKind || "").trim().toLowerCase();
  const id = String(targetId || "").trim().toLowerCase();
  return (Array.isArray(runtimeEffectBindings) ? runtimeEffectBindings : []).find((entry) => {
    const entryKind = String((entry && entry.targetKind) || "").trim().toLowerCase();
    const entryId = String((entry && entry.targetId) || "").trim().toLowerCase();
    return entryKind === kind && entryId === id;
  }) || null;
}

export function refreshBindingPanel({
  bindingGrid,
  bindingTargetSelect,
  selectedEffectOption,
  selectedEffectCategory,
  getRuntimeEffectTarget,
  runtimeEffectBindings,
}) {
  const opt = selectedEffectOption();
  if (!opt) return;
  const registryId = String(opt.dataset.registryId || "");
  const isCustom = String(opt.value || "").startsWith("custom:");
  const selectedTargetRegistryId = String((bindingTargetSelect && bindingTargetSelect.value) || "").trim().toLowerCase();
  const selectedTarget = selectedTargetRegistryId ? getRuntimeEffectTarget(selectedTargetRegistryId) : null;

  if (isCustom) {
    setBindingRows(bindingGrid, [
      { k: "Authored effect", v: String(opt.dataset.registryId || opt.value || "unknown") },
      { k: "Runtime target", v: "Not published yet" },
    ]);
    return;
  }

  if (!registryId) {
    setBindingRows(bindingGrid, [
      { k: "Binding", v: "No registry effect selected" },
    ]);
    return;
  }

  if (selectedTarget && registryId) {
    const selectedBinding = getBindingEntry(runtimeEffectBindings, selectedTarget.targetKind, selectedTarget.targetId);
    setBindingRows(bindingGrid, [
      { k: "Runtime target", v: selectedTarget.label || selectedTarget.id },
      { k: "Bound effect", v: String((selectedBinding && selectedBinding.effectId) || "No published binding yet") },
      { k: "Authored effect", v: registryId },
    ]);
    return;
  }

  const matches = (Array.isArray(runtimeEffectBindings) ? runtimeEffectBindings : [])
    .filter((entry) => String((entry && entry.effectId) || "") === registryId);

  if (!matches.length) {
    setBindingRows(bindingGrid, [
      { k: "Authored effect", v: registryId },
      { k: "Runtime target", v: "No runtime target binding yet" },
    ]);
    return;
  }

  setBindingRows(bindingGrid, [
    { k: "Authored effect", v: registryId },
    { k: "Runtime target", v: matches.map((entry) => `${entry.targetKind}.${entry.targetId}`).join(", ") },
  ]);
}

export function populateBindingTargetOptions(bindingTargetSelect, runtimeEffectTargetRegistry) {
  if (!bindingTargetSelect) return;
  const previousValue = String(bindingTargetSelect.value || "").trim().toLowerCase();
  const targets = Array.isArray(runtimeEffectTargetRegistry) ? runtimeEffectTargetRegistry : [];
  bindingTargetSelect.innerHTML = "";

  const groups = new Map();
  for (const target of targets) {
    const kind = String((target && target.targetKind) || "").trim().toLowerCase();
    const registryId = String((target && target.id) || "").trim().toLowerCase();
    if (!kind || !registryId) continue;
    if (!groups.has(kind)) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = kind === "spell" ? "spell" : kind === "orb-state" ? "orb-state" : kind;
      groups.set(kind, optgroup);
    }
    const opt = document.createElement("option");
    opt.value = registryId;
    opt.textContent = String(target.label || registryId);
    groups.get(kind).appendChild(opt);
  }

  for (const kind of ["spell", "orb-state"]) {
    if (groups.has(kind)) bindingTargetSelect.appendChild(groups.get(kind));
  }

  if (previousValue && Array.from(bindingTargetSelect.options).some((opt) => opt.value === previousValue)) {
    bindingTargetSelect.value = previousValue;
  }
}

function quoteString(value) {
  return JSON.stringify(String(value || ""));
}

function serializeBindingEntry(entry) {
  return [
    "  Object.freeze({",
    `    targetKind: ${quoteString(entry && entry.targetKind)},`,
    `    targetId: ${quoteString(entry && entry.targetId)},`,
    `    effectId: ${quoteString(entry && entry.effectId)},`,
    `    presetId: ${quoteString(entry && entry.presetId)},`,
    "  })",
  ].join("\n");
}

export function buildRuntimeEffectBindingsModule(runtimeEffectBindings) {
  const entries = (Array.isArray(runtimeEffectBindings) ? runtimeEffectBindings : [])
    .map((entry) => ({
      targetKind: String((entry && entry.targetKind) || "").trim().toLowerCase(),
      targetId: String((entry && entry.targetId) || "").trim().toLowerCase(),
      effectId: String((entry && entry.effectId) || "").trim(),
      presetId: String((entry && entry.presetId) || "").trim(),
    }))
    .filter((entry) => entry.targetKind && entry.targetId && entry.effectId && entry.presetId)
    .sort((a, b) => `${a.targetKind}:${a.targetId}`.localeCompare(`${b.targetKind}:${b.targetId}`));

  return `// Runtime target -> VFX binding schema (authoring/publish surface).
// Keeps VFX binding attached to runtime effect slots, not upstream triggers.

/**
 * @typedef {Object} RuntimeEffectBindingEntry
 * @property {"spell"|"orb-state"} targetKind
 * @property {string} targetId
 * @property {string} effectId
 * @property {string} presetId
 */

/** @type {ReadonlyArray<Readonly<RuntimeEffectBindingEntry>>} */
export const RUNTIME_EFFECT_BINDINGS = Object.freeze([
${entries.map((entry) => serializeBindingEntry(entry)).join(",\n")}
]);

export const RUNTIME_EFFECT_BINDINGS_BY_KEY = Object.freeze(
  RUNTIME_EFFECT_BINDINGS.reduce((acc, entry) => {
    const key = \`\${String((entry && entry.targetKind) || "").trim().toLowerCase()}:\${String((entry && entry.targetId) || "").trim().toLowerCase()}\`;
    if (!key || key === ":") return acc;
    acc[key] = entry;
    return acc;
  }, {})
);

export function getRuntimeEffectBinding(targetKind, targetId) {
  const key = \`\${String(targetKind || "").trim().toLowerCase()}:\${String(targetId || "").trim().toLowerCase()}\`;
  return RUNTIME_EFFECT_BINDINGS_BY_KEY[key] || null;
}
`;
}
