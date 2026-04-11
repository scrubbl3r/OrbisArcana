// Runtime target -> VFX binding schema (authoring/publish surface).
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
  Object.freeze({
    targetKind: "orb-state",
    targetId: "shattered",
    effectId: "orb.shatter_voronoi",
    presetId: "preset.orb_shatter.default",
  }),
  Object.freeze({
    targetKind: "spell",
    targetId: "aoe_electric",
    effectId: "spell.aoe_electric",
    presetId: "preset.spell-aoe-electric.electric-aoe",
  }),
  Object.freeze({
    targetKind: "spell",
    targetId: "aoe_flame",
    effectId: "spell.aoe_flame",
    presetId: "preset.spell-aoe-flame.flame-aoe",
  }),
  Object.freeze({
    targetKind: "spell",
    targetId: "bubble_shield",
    effectId: "spell.shield_bubble",
    presetId: "preset.bubble_shield.default",
  })
]);

export const RUNTIME_EFFECT_BINDINGS_BY_KEY = Object.freeze(
  RUNTIME_EFFECT_BINDINGS.reduce((acc, entry) => {
    const key = `${String((entry && entry.targetKind) || "").trim().toLowerCase()}:${String((entry && entry.targetId) || "").trim().toLowerCase()}`;
    if (!key || key === ":") return acc;
    acc[key] = entry;
    return acc;
  }, {})
);

export function getRuntimeEffectBinding(targetKind, targetId) {
  const key = `${String(targetKind || "").trim().toLowerCase()}:${String(targetId || "").trim().toLowerCase()}`;
  return RUNTIME_EFFECT_BINDINGS_BY_KEY[key] || null;
}
