// VFX authoring/runtime registry (SSOT for effect identity + publishable targets).
// This does not execute effects; it names them and describes how they are used.

/**
 * @typedef {Object} VfxEffectRegistryEntry
 * @property {string} id Stable effect id used by bindings (for example `spell.aoe_flame`).
 * @property {"spell"|"orb"|"globe"|"world-item"|"enemy"} category High-level domain bucket for lab organization.
 * @property {string} runtimeModuleId Runtime implementation id/path token (not necessarily a file path).
 * @property {string} defaultPresetId Default preset id used when a binding does not override.
 * @property {string[]} supportedContexts Where the effect can be previewed/executed (`lab`, `receiver`, etc.).
 * @property {string[]} publishTargets What the lab can publish for this effect (`preset`, `binding`).
 * @property {string} [label] Human-readable label for lab dropdowns.
 */

/** @type {ReadonlyArray<Readonly<VfxEffectRegistryEntry>>} */
export const VFX_EFFECT_REGISTRY = Object.freeze([
  Object.freeze({
    id: "spell.aoe_flame",
    label: "Flame AOE",
    category: "spell",
    runtimeModuleId: "flame_aoe_runtime",
    defaultPresetId: "preset.flame_aoe.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "spell.aoe_electric",
    label: "Electric AOE",
    category: "spell",
    runtimeModuleId: "electric_aoe_runtime",
    defaultPresetId: "preset.electric_aoe.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "spell.shield_bubble",
    label: "Bubble Shield",
    category: "spell",
    runtimeModuleId: "bubble_shield_runtime",
    defaultPresetId: "preset.bubble_shield.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "orb.shatter_voronoi",
    label: "Orb Shatter (Voronoi)",
    category: "orb",
    runtimeModuleId: "orb_shatter_runtime",
    defaultPresetId: "preset.orb_shatter.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "spell.shockwave_ring",
    label: "Shockwave",
    category: "spell",
    runtimeModuleId: "shockwave_runtime",
    defaultPresetId: "preset.shockwave.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset"],
  }),
]);

export const VFX_EFFECT_REGISTRY_BY_ID = Object.freeze(
  VFX_EFFECT_REGISTRY.reduce((acc, entry) => {
    const id = String(entry && entry.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = entry;
    return acc;
  }, {})
);

export function getVfxEffectRegistryEntry(effectId) {
  return VFX_EFFECT_REGISTRY_BY_ID[String(effectId || "").toLowerCase()] || null;
}
