import { resolveRuntimeEffectBinding } from "./resolve-runtime-effect-binding.js";

/**
 * Resolve an orb visual/runtime state into its VFX binding, if one exists.
 *
 * @param {string} orbStateId
 * @returns {null|{targetKind:"orb-state", targetId:string, effectId:string, presetId:string, effect:Object|null}}
 */
export function resolveOrbStateVfxBinding(orbStateId) {
  const stateId = String(orbStateId || "").trim().toLowerCase();
  if (!stateId) return null;
  return resolveRuntimeEffectBinding("orb-state", stateId);
}
