// Spell -> VFX binding schema (authoring/publish surface).
// Keeps spell visual usage separate from spell gameplay action routing.

/**
 * @typedef {Object} SpellVfxActionBinding
 * @property {string} castActionId Which action this VFX binding describes (for example `aoe_flame`).
 * @property {string} effectId VFX effect registry id.
 * @property {string} presetId Preset id to use for this action/effect.
 */

/**
 * @typedef {Object} SpellVfxPostActionBinding
 * @property {string} id Follow-up action id (for example `orb_super_grace`).
 * @property {string} [effectId] Optional VFX effect registry id if the post action has a visual component.
 * @property {string} [presetId] Optional preset id for the post action VFX.
 * @property {Object} [payload] Optional action payload override (for example `{ ms: 2500 }`).
 */

/**
 * @typedef {Object} SpellVfxBindingEntry
 * @property {string} spellId Canonical spell id.
 * @property {SpellVfxActionBinding} primary
 * @property {SpellVfxPostActionBinding[]} [postCastActions]
 */

/** @type {ReadonlyArray<Readonly<SpellVfxBindingEntry>>} */
export const SPELL_VFX_BINDINGS = Object.freeze([
  Object.freeze({
    spellId: "rota",
    primary: Object.freeze({
      castActionId: "aoe_axis",
      effectId: "spell.aoe_flame",
      presetId: "preset.flame_aoe.default",
    }),
    postCastActions: Object.freeze([
      Object.freeze({
        id: "orb_super_grace",
        payload: Object.freeze({ ms: 2500 }),
      }),
    ]),
  }),
  Object.freeze({
    spellId: "vectus",
    primary: Object.freeze({
      castActionId: "aoe_electric",
      effectId: "spell.aoe_electric",
      presetId: "preset.electric_aoe.default",
    }),
  }),
  Object.freeze({
    spellId: "sanctum",
    primary: Object.freeze({
      castActionId: "sanctum_shield",
      effectId: "spell.shield_bubble",
      presetId: "preset.bubble_shield.default",
    }),
  }),
]);

export const SPELL_VFX_BINDINGS_BY_SPELL_ID = Object.freeze(
  SPELL_VFX_BINDINGS.reduce((acc, entry) => {
    const spellId = String(entry && entry.spellId || "").toLowerCase();
    if (!spellId) return acc;
    acc[spellId] = entry;
    return acc;
  }, {})
);

export function getSpellVfxBinding(spellId) {
  return SPELL_VFX_BINDINGS_BY_SPELL_ID[String(spellId || "").toLowerCase()] || null;
}

export const SPELL_VFX_BINDINGS_V1 = SPELL_VFX_BINDINGS;
