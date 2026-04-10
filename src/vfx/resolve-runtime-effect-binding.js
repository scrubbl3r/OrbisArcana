import {
  getRuntimeEffectBinding,
  getVfxEffectRegistryEntry,
} from "../content/vfx/index.js";

/**
 * Resolve a runtime-target VFX binding entry into a lab/game-friendly structure.
 *
 * @param {"spell"|"orb-state"} targetKind
 * @param {string} targetId
 * @returns {null|{targetKind:"spell"|"orb-state", targetId:string, effectId:string, presetId:string, effect:Object|null}}
 */
export function resolveRuntimeEffectBinding(targetKind, targetId) {
  const kind = String(targetKind || "").trim().toLowerCase();
  const id = String(targetId || "").trim().toLowerCase();
  if (!kind || !id) return null;

  const binding = getRuntimeEffectBinding(kind, id);
  if (!binding) return null;

  return {
    targetKind: /** @type {"spell"|"orb-state"} */ (kind),
    targetId: id,
    effectId: String(binding.effectId || ""),
    presetId: String(binding.presetId || ""),
    effect: binding.effectId ? getVfxEffectRegistryEntry(binding.effectId) : null,
  };
}
