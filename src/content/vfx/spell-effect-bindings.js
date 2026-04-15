// Word -> VFX binding schema (authoring/publish surface).
// Keeps word visual usage separate from word gameplay action routing.

/**
 * @typedef {Object} SpellVfxActionBinding
 * @property {string} castActionId Which action this VFX binding describes (for example `aoe_flame`).
 * @property {string} effectId VFX effect registry id.
 * @property {string} presetId Preset id to use for this action/effect.
 */

/**
 * @typedef {Object} SpellVfxBindingEntry
 * @property {string} wordId Canonical word id.
 * @property {string} [spellId] Legacy compatibility alias for `wordId`.
 * @property {SpellVfxActionBinding} primary
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
  }),
  Object.freeze({
    wordId: "azerith",
    spellId: "azerith",
    primary: Object.freeze({
      castActionId: "bubble_shield",
      effectId: "spell.shield_bubble",
      presetId: "preset.bubble_shield.default",
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

// Legacy aliases preserved for older lab/runtime surfaces that still speak in
// spell-first terms while the repo converges on word-first naming.
export const SPELL_VFX_BINDINGS = WORD_VFX_BINDINGS;
export const SPELL_VFX_BINDINGS_BY_SPELL_ID = WORD_VFX_BINDINGS_BY_WORD_ID;

export function getSpellVfxBinding(spellId) {
  return getWordVfxBinding(spellId);
}
