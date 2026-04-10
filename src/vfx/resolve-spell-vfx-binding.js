import { getRuntimeWordById } from "../content/spells/runtime-spells.js";
import { resolveRuntimeEffectBinding } from "./resolve-runtime-effect-binding.js";

/**
 * Resolve a spell VFX binding entry into a lab/game-friendly structure.
 *
 * This is intentionally read-only and does not mutate runtime spell content.
 * It now resolves through runtime-target VFX bindings via castActionId instead
 * of using the legacy word-binding schema directly.
 *
 * @param {string} wordId
 * @returns {null|{wordId:string, spellId:string, primary:Object|null, postCastActions:Array<Object>}}
 */
export function resolveSpellVfxBinding(wordId) {
  const runtimeWord = getRuntimeWordById(wordId);
  if (!runtimeWord) return null;

  const resolvedWordId = String(runtimeWord.id || "").toLowerCase();
  const castActionId = String(runtimeWord.castActionId || "").trim().toLowerCase();
  const primary = castActionId
    ? resolveRuntimeEffectBinding("spell", castActionId)
    : null;

  const postCastActions = Array.isArray(runtimeWord.postCastActions)
    ? runtimeWord.postCastActions.map((action) => ({
        ...action,
        effect: null,
      }))
    : [];

  return {
    wordId: resolvedWordId,
    spellId: resolvedWordId,
    primary,
    postCastActions,
  };
}

// Canonical alias: preserve existing function name while exposing word-first naming.
export const resolveWordVfxBinding = resolveSpellVfxBinding;
