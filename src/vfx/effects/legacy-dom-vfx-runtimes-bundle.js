import { createLegacyDomBubbleShieldRuntime } from "./spells/bubble-shield-legacy-dom-runtime.js";
import { createLegacyDomShockwaveRuntime } from "./spells/shockwave-legacy-dom-runtime.js";
import { createLegacyDomOrbShatterRuntime } from "./orb-states/orb-shatter-legacy-dom-runtime.js";
import { createLegacyDomFlameAoeRuntime } from "./spells/flame-aoe-legacy-dom-runtime.js";
import { createLegacyDomElectricAoeRuntime } from "./spells/electric-aoe-legacy-dom-runtime.js";

/**
 * @typedef {Object} LegacyDomVfxRuntimesBundle
 * @property {Object|null} legacyDomBubbleShieldRuntime
 * @property {Object|null} legacyDomShockwaveRuntime
 * @property {Object|null} legacyDomOrbShatterRuntime
 * @property {Object|null} legacyDomFlameAoeRuntime
 * @property {Object|null} legacyDomElectricAoeRuntime
 * @property {() => void} clearAll
 * @property {() => void} destroy
 */

/**
 * Create the receiver VFX runtime instances in one place.
 *
 * Each nested option object is passed through to the underlying runtime factory.
 * Missing/invalid options simply skip that runtime and return `null` for it.
 *
 * @param {Object} [options]
 * @param {Object} [options.bubbleShield]
 * @param {Object} [options.shockwave]
 * @param {Object} [options.legacyDomOrbShatter]
 * @param {Object} [options.flameAoe]
 * @param {Object} [options.electricAoe]
 * @returns {LegacyDomVfxRuntimesBundle}
 */
export function createLegacyDomVfxRuntimesBundle(options = {}) {
  const legacyDomBubbleShieldRuntime = options.bubbleShield ? createLegacyDomBubbleShieldRuntime(options.bubbleShield) : null;
  const legacyDomShockwaveRuntime = options.shockwave ? createLegacyDomShockwaveRuntime(options.shockwave) : null;
  const legacyDomOrbShatterRuntime = options.legacyDomOrbShatter
    ? createLegacyDomOrbShatterRuntime(options.legacyDomOrbShatter)
    : null;
  const legacyDomFlameAoeRuntime = options.flameAoe ? createLegacyDomFlameAoeRuntime(options.flameAoe) : null;
  const legacyDomElectricAoeRuntime = options.electricAoe ? createLegacyDomElectricAoeRuntime(options.electricAoe) : null;

  function clearAll() {
    try { legacyDomShockwaveRuntime && typeof legacyDomShockwaveRuntime.clear === "function" && legacyDomShockwaveRuntime.clear(); } catch (_) {}
    try { legacyDomBubbleShieldRuntime && typeof legacyDomBubbleShieldRuntime.off === "function" && legacyDomBubbleShieldRuntime.off(); } catch (_) {}
    try { legacyDomOrbShatterRuntime && typeof legacyDomOrbShatterRuntime.clear === "function" && legacyDomOrbShatterRuntime.clear(); } catch (_) {}
    try { legacyDomFlameAoeRuntime && typeof legacyDomFlameAoeRuntime.clear === "function" && legacyDomFlameAoeRuntime.clear(); } catch (_) {}
    try { legacyDomElectricAoeRuntime && typeof legacyDomElectricAoeRuntime.clear === "function" && legacyDomElectricAoeRuntime.clear(); } catch (_) {}
  }

  function destroy() {
    try { legacyDomBubbleShieldRuntime && typeof legacyDomBubbleShieldRuntime.destroy === "function" && legacyDomBubbleShieldRuntime.destroy(); } catch (_) {}
    try { legacyDomShockwaveRuntime && typeof legacyDomShockwaveRuntime.destroy === "function" && legacyDomShockwaveRuntime.destroy(); } catch (_) {}
    try { legacyDomOrbShatterRuntime && typeof legacyDomOrbShatterRuntime.destroy === "function" && legacyDomOrbShatterRuntime.destroy(); } catch (_) {}
    try { legacyDomFlameAoeRuntime && typeof legacyDomFlameAoeRuntime.destroy === "function" && legacyDomFlameAoeRuntime.destroy(); } catch (_) {}
    try { legacyDomElectricAoeRuntime && typeof legacyDomElectricAoeRuntime.destroy === "function" && legacyDomElectricAoeRuntime.destroy(); } catch (_) {}
  }

  return {
    legacyDomBubbleShieldRuntime,
    legacyDomShockwaveRuntime,
    legacyDomOrbShatterRuntime,
    legacyDomFlameAoeRuntime,
    legacyDomElectricAoeRuntime,
    clearAll,
    destroy,
  };
}
