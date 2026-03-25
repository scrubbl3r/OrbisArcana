// Shared wake-related ids/tokens used by wake alias/precedence contract checks.
// Keep ids synthetic and deterministic so tests remain stable over content changes.
export const UNKNOWN_WAKE_WORD_ID_V2 = "__unknown_wake_word__";
export const OTHER_UNKNOWN_WAKE_WORD_ID_V2 = "__other_unknown_wake_word__";
export const SAMPLE_WAKE_RULE_ID_V2 = "electric_aoe";
export const KNOWN_WAKE_WORD_ID_V2 = "rota";
export const KNOWN_WAKE_WORD_WORD_SELECTOR_V2 = `word.${KNOWN_WAKE_WORD_ID_V2}`;
export const KNOWN_WAKE_WORD_SPELL_SELECTOR_V2 = `spell.${KNOWN_WAKE_WORD_ID_V2}`;
export const UNKNOWN_WAKE_WORD_WORD_SELECTOR_V2 = `word.${UNKNOWN_WAKE_WORD_ID_V2}`;
export const UNKNOWN_WAKE_WORD_SPELL_SELECTOR_V2 = `spell.${UNKNOWN_WAKE_WORD_ID_V2}`;
export const WAKE_UNKNOWN_WORD_ERROR_PREFIX_V2 = "wake_win references unknown word id: ";
export const UNKNOWN_INACTIVE_WORD_ERROR_PREFIX_V2 = "references unknown/inactive word id: ";
export const OPEN_UNKNOWN_INACTIVE_WORD_ERROR_PREFIX_V2 = `open ${UNKNOWN_INACTIVE_WORD_ERROR_PREFIX_V2}`;
export const wakeUnknownWordErrorTokenV2 = (wordId) => `${WAKE_UNKNOWN_WORD_ERROR_PREFIX_V2}${wordId}`;
export const unknownInactiveWordErrorTokenV2 = (wordId) => `${UNKNOWN_INACTIVE_WORD_ERROR_PREFIX_V2}${wordId}`;
export const openUnknownInactiveWordErrorTokenV2 = (wordId) => `${OPEN_UNKNOWN_INACTIVE_WORD_ERROR_PREFIX_V2}${wordId}`;
