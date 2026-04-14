import { resolveOrbGracePayload } from "../orb/orb-grace.js";

/**
 * @typedef {Object} SpellCastExecutorResult
 * @property {boolean} handled Whether an action handler was found/executed.
 * @property {boolean} blocked Whether execution was blocked before handler dispatch.
 * @property {string} [reason] Domain reason for a blocked or skipped cast.
 * @property {boolean} grantGrace Whether orb grace was granted from authored interaction data.
 * @property {number} graceTtlMs Resolved grace duration (when granted).
 */

/**
 * @typedef {Object} SpellCastExecutor
 * @property {(castActionId:string, context?:{payload?:Object}) => SpellCastExecutorResult} execute
 */

/**
 * @typedef {Object} CreateSpellCastExecutorOptions
 * @property {Object<string, {handlerKey?:string}>} [castActionRegistryById]
 * @property {Object<string, Function>} [handlers] Receiver-local handler functions keyed by `handlerKey`.
 * @property {(grace:{ttlMs:number}) => void} [grantOrbGrace] Receiver hook for orb grace application.
 * @property {() => {allowed?:boolean, reason?:string}|null} [getCastGateState] Domain gate consulted before handler dispatch.
 * @property {number} [defaultGraceTtlMs] Default authored grace duration when `grace: {}` is present.
 */

/**
 * Create a runtime spell cast executor that:
 * - resolves action metadata from `castActionId`
 * - dispatches to a local handler
 * - applies authored interaction grace when present
 *
 * The receiver remains responsible for providing concrete handler implementations.
 *
 * @param {CreateSpellCastExecutorOptions} [options]
 * @returns {SpellCastExecutor}
 */
export function createSpellCastExecutor({
  castActionRegistryById,
  handlers,
  grantOrbGrace,
  getCastGateState,
  defaultGraceTtlMs = 2500,
} = {}) {
  const registry = castActionRegistryById || Object.create(null);
  const handlerMap = handlers || Object.create(null);

  function execute(castActionId, context = {}) {
    const actionId = String(castActionId || "").toLowerCase();
    const p = (context && context.payload) || {};
    const castGateState = (typeof getCastGateState === "function")
      ? (getCastGateState() || null)
      : null;
    const castBlockedReason = castGateState && castGateState.allowed === false
      ? String(castGateState.reason || "blocked")
      : "";
    if (castBlockedReason) {
      return {
        handled: false,
        blocked: true,
        reason: castBlockedReason,
        grantGrace: false,
        graceTtlMs: 0,
      };
    }
    const meta = registry[actionId] || null;
    const handlerKey = String((meta && meta.handlerKey) || "");
    const handler = handlerMap[handlerKey];
    let handled = false;
    let grantGrace = false;
    let graceTtlMs = 0;

    if (typeof handler === "function") {
      handler(p);
      handled = true;
    }

    const resolvedGrace = handled
      ? resolveOrbGracePayload(p && p.grace, { defaultTtlMs: defaultGraceTtlMs })
      : null;
    if (resolvedGrace && typeof grantOrbGrace === "function") {
      grantOrbGrace(resolvedGrace);
      grantGrace = true;
      graceTtlMs = Number(resolvedGrace.ttlMs) || 0;
    }

    return { handled, blocked: false, reason: "", grantGrace, graceTtlMs };
  }

  return { execute };
}
