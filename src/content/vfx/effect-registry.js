// VFX authoring/runtime registry (SSOT for effect identity + publishable targets).
// This does not execute effects; it names them and describes how they are used.

/**
 * @typedef {Object} VfxEffectRegistryEntry
 * @property {string} id Stable effect id used by bindings (for example `spell.aoe_flame`).
 * @property {"spell"|"orb"|"world"|"enemy"} category High-level domain bucket for lab organization.
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
    id: "spell.tesla_1",
    label: "Tesla 1",
    category: "spell",
    runtimeModuleId: "tesla_1_runtime",
    defaultPresetId: "preset.spell-tesla-1.tesla-1",
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
    id: "spell.shield_bubble3d",
    label: "Bubble Shield 3D",
    category: "spell",
    runtimeModuleId: "bubble_shield3d_runtime",
    defaultPresetId: "preset.bubble_shield3d.default",
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
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "spell.shockwave_sphere3d",
    label: "Shockwave 3D",
    category: "spell",
    runtimeModuleId: "shockwave3d_runtime",
    defaultPresetId: "preset.spell-shockwave-sphere3d.shockwave-3d",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "spell.teleport",
    label: "Teleport",
    category: "spell",
    runtimeModuleId: "teleport_runtime",
    defaultPresetId: "preset.teleport.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "spell.float",
    label: "Float 3D",
    category: "spell",
    runtimeModuleId: "float_runtime",
    defaultPresetId: "preset.float.stub",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "orb.nod",
    label: "Orb Nod",
    category: "orb",
    runtimeModuleId: "orb_nod_runtime",
    defaultPresetId: "preset.orb-nod.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "orb.nod3d",
    label: "Orb Nod 3D",
    category: "orb",
    runtimeModuleId: "orb_nod3d_runtime",
    defaultPresetId: "preset.orb-nod3d.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "orb.spawn",
    label: "Orb Spawn",
    category: "orb",
    runtimeModuleId: "orb_spawn_runtime",
    defaultPresetId: "preset.orb-spawn.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "orb.globe",
    label: "Orb Globe",
    category: "orb",
    runtimeModuleId: "orb_globe_runtime",
    defaultPresetId: "preset.orb-globe.default",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "orb.spin",
    label: "Orb Spin",
    category: "orb",
    runtimeModuleId: "orb_spin_runtime",
    defaultPresetId: "preset.orb-spin.stub",
    supportedContexts: ["lab", "receiver"],
    publishTargets: ["preset", "binding"],
  }),
  Object.freeze({
    id: "world.globe",
    label: "World Globe",
    category: "world",
    runtimeModuleId: "world_globe_runtime",
    defaultPresetId: "preset.world_globe.default",
    supportedContexts: ["lab"],
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
