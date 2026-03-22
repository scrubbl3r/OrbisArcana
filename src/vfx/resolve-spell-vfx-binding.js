import { getWordVfxBinding, getVfxEffectRegistryEntry } from "../content/vfx/index.js";

/**
 * Resolve a spell VFX binding entry into a lab/game-friendly structure.
 *
 * This is intentionally read-only and does not mutate runtime spell content.
 * It provides a stable bridge for future lab "publish binding" flows.
 *
 * @param {string} wordId
 * @returns {null|{wordId:string, spellId:string, primary:Object|null, postCastActions:Array<Object>}}
 */
export function resolveSpellVfxBinding(wordId) {
  const binding = getWordVfxBinding(wordId);
  if (!binding) return null;

  const primary = binding.primary
    ? {
        ...binding.primary,
        effect: getVfxEffectRegistryEntry(binding.primary.effectId),
      }
    : null;

  const postCastActions = Array.isArray(binding.postCastActions)
    ? binding.postCastActions.map((a) => ({
        ...a,
        effect: a && a.effectId ? getVfxEffectRegistryEntry(a.effectId) : null,
      }))
    : [];

  const resolvedWordId = String(binding.wordId || "").toLowerCase();
  return {
    wordId: resolvedWordId,
    spellId: resolvedWordId,
    primary,
    postCastActions,
  };
}

// Canonical alias: preserve existing function name while exposing word-first naming.
export const resolveWordVfxBinding = resolveSpellVfxBinding;
