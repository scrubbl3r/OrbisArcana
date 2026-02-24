import { getSpellVfxBinding, getVfxEffectRegistryEntry } from "../content/vfx/index.js";

/**
 * Resolve a spell VFX binding entry into a lab/game-friendly structure.
 *
 * This is intentionally read-only and does not mutate runtime spell content.
 * It provides a stable bridge for future lab "publish binding" flows.
 *
 * @param {string} spellId
 * @returns {null|{spellId:string, primary:Object|null, postCastActions:Array<Object>}}
 */
export function resolveSpellVfxBinding(spellId) {
  const binding = getSpellVfxBinding(spellId);
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

  return {
    spellId: String(binding.spellId || "").toLowerCase(),
    primary,
    postCastActions,
  };
}

