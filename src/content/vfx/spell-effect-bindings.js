// Word -> VFX binding schema (authoring/publish surface).
// Keeps word visual usage separate from word gameplay action routing.

/**
 * @typedef {Object} SpellVfxActionBinding
 * @property {string} castActionId Which action this VFX binding describes (for example `aoe_flame`).
 * @property {string} effectId VFX effect registry id.
 * @property {string} presetId Preset id to use for this action/effect.
 */

/**
 * @typedef {Object} SpellVfxPostActionBinding
 * @property {string} id Follow-up action id (for example `float_grace`).
 * @property {string} [effectId] Optional VFX effect registry id if the post action has a visual component.
 * @property {string} [presetId] Optional preset id for the post action VFX.
 * @property {Object} [payload] Optional action payload override (for example `{ ms: 2500 }`).
 */

/**
 * @typedef {Object} SpellVfxBindingEntry
 * @property {string} wordId Canonical word id.
 * @property {string} [spellId] Legacy compatibility alias for `wordId`.
 * @property {SpellVfxActionBinding} primary
 * @property {SpellVfxPostActionBinding[]} [postCastActions]
 */

/** @type {ReadonlyArray<Readonly<SpellVfxBindingEntry>>} */
export const WORD_VFX_BINDINGS = Object.freeze([
  Object.freeze({
    wordId: "rota",
    spellId: "rota",
    primary: Object.freeze({
      castActionId: "aoe_flame",
      effectId: "spell.aoe_flame",
      presetId: "preset.flame_aoe.default",
    }),
    postCastActions: Object.freeze([
      Object.freeze({
        id: "float_grace",
        payload: Object.freeze({ ms: 2500 }),
      }),
    ]),
  }),
  Object.freeze({
    wordId: "vectus",
    spellId: "vectus",
    primary: Object.freeze({
      castActionId: "aoe_electric",
      effectId: "spell.aoe_electric",
      presetId: "preset.electric_aoe.default",
    }),
  }),
  Object.freeze({
    wordId: "sanctum",
    spellId: "sanctum",
    primary: Object.freeze({
      castActionId: "bubble_shield",
      effectId: "spell.shield_bubble",
      presetId: "preset.bubble_shield.default",
    }),
  }),
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
