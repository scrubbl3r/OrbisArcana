import { resolveRuntimeEffectBinding } from "./resolve-runtime-effect-binding.js";

/**
 * Resolve a runtime-target VFX binding and dispatch its bound effect through
 * the provided runtime hooks.
 *
 * This keeps runtime-target binding authoritative while letting host shells
 * decide which concrete runtimes are available.
 *
 * @param {Object} options
 * @param {"spell"|"orb-state"} options.targetKind
 * @param {string} options.targetId
 * @param {Object} [options.runtime]
 * @param {Function} [options.runtime.playFlameAoe]
 * @param {Function} [options.runtime.playElectricAoe]
 * @param {Function} [options.runtime.triggerShockwave]
 * @param {Function} [options.runtime.activateBubbleShield]
 * @param {Function} [options.runtime.playOrbShatter]
 * @param {Function} [options.runtime.playOrbNod]
 * @param {Function} [options.runtime.playOrbNod3d]
 * @param {Function} [options.runtime.playOrbGlobe]
 * @param {Function} [options.runtime.playTeleport]
 * @param {Object} [options.payload]
 * @returns {{handled:boolean, skipped?:string, binding?:Object|null}}
 */
export function dispatchRuntimeEffect({
  targetKind,
  targetId,
  runtime = {},
  payload = {},
} = {}) {
  const binding = resolveRuntimeEffectBinding(targetKind, targetId);
  if (!binding) {
    return { handled: false, skipped: "binding_missing", binding: null };
  }

  switch (String(binding.effectId || "").trim().toLowerCase()) {
    case "spell.aoe_flame":
      return typeof runtime.playFlameAoe === "function"
        ? { ...(runtime.playFlameAoe(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "spell.aoe_electric":
      return typeof runtime.playElectricAoe === "function"
        ? { ...(runtime.playElectricAoe(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "spell.shockwave_ring":
      return typeof runtime.triggerShockwave === "function"
        ? { ...(runtime.triggerShockwave(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "spell.shield_bubble":
    case "spell.shield_bubble3d":
      return typeof runtime.activateBubbleShield === "function"
        ? { ...(runtime.activateBubbleShield(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "spell.teleport":
      return typeof runtime.playTeleport === "function"
        ? { ...(runtime.playTeleport(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "orb.shatter_voronoi":
      return typeof runtime.playOrbShatter === "function"
        ? { ...(runtime.playOrbShatter(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "orb.nod":
      return typeof runtime.playOrbNod === "function"
        ? { ...(runtime.playOrbNod(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "orb.nod3d":
      return typeof runtime.playOrbNod3d === "function"
        ? { ...(runtime.playOrbNod3d(payload) || { handled: false }), binding }
        : { handled: false, skipped: "runtime_missing", binding };
    case "orb.globe":
      if (typeof runtime.playOrbGlobe === "function") {
        return { ...(runtime.playOrbGlobe(payload) || { handled: false }), binding };
      }
      return { handled: true, skipped: "stateful_visual", binding };
    default:
      return { handled: false, skipped: "effect_unhandled", binding };
  }
}
