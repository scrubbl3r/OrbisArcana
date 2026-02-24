import { createBubbleShieldRuntime } from "./bubble-shield-runtime.js";
import { createShockwaveRuntime } from "./shockwave-runtime.js";
import { createOrbShatterRuntime } from "./orb-shatter-runtime.js";
import { createFlameAoeRuntime } from "./flame-aoe-runtime.js";
import { createElectricAoeRuntime } from "./electric-aoe-runtime.js";

/**
 * @typedef {Object} VfxRuntimesBundle
 * @property {Object|null} bubbleShieldRuntime
 * @property {Object|null} shockwaveRuntime
 * @property {Object|null} orbShatterRuntime
 * @property {Object|null} flameAoeRuntime
 * @property {Object|null} electricAoeRuntime
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
 * @param {Object} [options.orbShatter]
 * @param {Object} [options.flameAoe]
 * @param {Object} [options.electricAoe]
 * @returns {VfxRuntimesBundle}
 */
export function createVfxRuntimesBundle(options = {}) {
  const bubbleShieldRuntime = options.bubbleShield ? createBubbleShieldRuntime(options.bubbleShield) : null;
  const shockwaveRuntime = options.shockwave ? createShockwaveRuntime(options.shockwave) : null;
  const orbShatterRuntime = options.orbShatter ? createOrbShatterRuntime(options.orbShatter) : null;
  const flameAoeRuntime = options.flameAoe ? createFlameAoeRuntime(options.flameAoe) : null;
  const electricAoeRuntime = options.electricAoe ? createElectricAoeRuntime(options.electricAoe) : null;

  function clearAll() {
    try { shockwaveRuntime && typeof shockwaveRuntime.clear === "function" && shockwaveRuntime.clear(); } catch (_) {}
    try { bubbleShieldRuntime && typeof bubbleShieldRuntime.off === "function" && bubbleShieldRuntime.off(); } catch (_) {}
    try { orbShatterRuntime && typeof orbShatterRuntime.clear === "function" && orbShatterRuntime.clear(); } catch (_) {}
    try { flameAoeRuntime && typeof flameAoeRuntime.clear === "function" && flameAoeRuntime.clear(); } catch (_) {}
    try { electricAoeRuntime && typeof electricAoeRuntime.clear === "function" && electricAoeRuntime.clear(); } catch (_) {}
  }

  function destroy() {
    try { bubbleShieldRuntime && typeof bubbleShieldRuntime.destroy === "function" && bubbleShieldRuntime.destroy(); } catch (_) {}
    try { shockwaveRuntime && typeof shockwaveRuntime.destroy === "function" && shockwaveRuntime.destroy(); } catch (_) {}
    try { orbShatterRuntime && typeof orbShatterRuntime.destroy === "function" && orbShatterRuntime.destroy(); } catch (_) {}
    try { flameAoeRuntime && typeof flameAoeRuntime.destroy === "function" && flameAoeRuntime.destroy(); } catch (_) {}
    try { electricAoeRuntime && typeof electricAoeRuntime.destroy === "function" && electricAoeRuntime.destroy(); } catch (_) {}
  }

  return {
    bubbleShieldRuntime,
    shockwaveRuntime,
    orbShatterRuntime,
    flameAoeRuntime,
    electricAoeRuntime,
    clearAll,
    destroy,
  };
}
