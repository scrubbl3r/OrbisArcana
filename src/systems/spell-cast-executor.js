/**
 * @typedef {Object} SpellCastExecutorResult
 * @property {boolean} handled Whether an action handler was found/executed.
 * @property {boolean} grantGrace Whether float grace was granted by policy.
 * @property {number} floatGraceMs Resolved float grace duration (when granted).
 */

/**
 * @typedef {Object} SpellCastExecutor
 * @property {(castActionId:string, context?:{payload?:Object}) => SpellCastExecutorResult} execute
 */

/**
 * @typedef {Object} CreateSpellCastExecutorOptions
 * @property {Object<string, {handlerKey?:string, floatGracePolicy?:string}>} [castActionRegistryById]
 * @property {Object<string, Function>} [handlers] Receiver-local handler functions keyed by `handlerKey`.
 * @property {(ms:number) => void} [grantFloatGrace] Receiver hook for float grace application.
 * @property {number} [floatGraceDefaultMs] Default grace duration for `default` policy.
 * @property {number} [floatGraceDomusMs] Grace duration for `domus` policy.
 */

/**
 * Create a runtime spell cast executor that:
 * - resolves action metadata from `castActionId`
 * - dispatches to a local handler
 * - applies float grace policy
 *
 * The receiver remains responsible for providing concrete handler implementations.
 *
 * @param {CreateSpellCastExecutorOptions} [options]
 * @returns {SpellCastExecutor}
 */
export function createSpellCastExecutor({
  castActionRegistryById,
  handlers,
  grantFloatGrace,
  floatGraceDefaultMs = 1000,
  floatGraceDomusMs = 5000,
} = {}){
  const registry = castActionRegistryById || Object.create(null);
  const handlerMap = handlers || Object.create(null);

  function execute(castActionId, context = {}){
    const actionId = String(castActionId || "").toLowerCase();
    const p = (context && context.payload) || {};
    const meta = registry[actionId] || null;
    const handlerKey = String(meta && meta.handlerKey || "");
    const floatGracePolicy = String(meta && meta.floatGracePolicy || "default");
    const handler = handlerMap[handlerKey];
    let handled = false;
    let grantGrace = true;
    let floatGraceMs = Number(p && p.floatGraceMs);

    if (typeof handler === "function") {
      handler(p);
      handled = true;
    }

    if (floatGracePolicy === "none") {
      grantGrace = false;
    } else if (floatGracePolicy === "domus") {
      floatGraceMs = Number(floatGraceDomusMs);
    }

    if (grantGrace && typeof grantFloatGrace === "function") {
      if (!Number.isFinite(floatGraceMs)) floatGraceMs = Number(floatGraceDefaultMs);
      grantFloatGrace(floatGraceMs);
    }

    return { handled, grantGrace, floatGraceMs };
  }

  return { execute };
}
