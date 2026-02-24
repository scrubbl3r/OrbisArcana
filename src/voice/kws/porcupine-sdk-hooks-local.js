/**
 * Local Porcupine SDK hooks installer (project integration point).
 *
 * This file installs `window.OrbisPorcupineSdkHooks` and delegates to a local
 * bridge object when available:
 *
 *   window.OrbisPorcupineSdkBridge = {
 *     createSession({ stream, keywords, onDetection, onError, context }) => {
 *       return { start(), stop(), destroy(), getStatus() }
 *     }
 *   }
 *
 * Why a bridge:
 * - Keeps vendor-specific SDK code isolated
 * - Lets local boot and receiver stay stable
 * - Easy to replace when SDK APIs change
 */

function resolveBridge() {
  if (typeof window === "undefined") return null;
  const bridge = window.OrbisPorcupineSdkBridge;
  if (!bridge || typeof bridge !== "object") return null;
  if (typeof bridge.createSession !== "function") return null;
  return bridge;
}

/**
 * Install local SDK hooks that call `window.OrbisPorcupineSdkBridge.createSession(...)`.
 *
 * Safe behavior:
 * - installs hooks only if bridge exists (unless `force` is true)
 * - returns null when no bridge is available
 */
export function installOrbisPorcupineSdkHooksLocal(opts = {}) {
  if (typeof window === "undefined") return null;
  const bridge = resolveBridge();
  const force = !!opts.force;
  if (!bridge && !force) return null;

  window.OrbisPorcupineSdkHooks = {
    async createSession(ctx = {}) {
      const {
        stream,
        keywords = [],
        onDetection,
        onError,
        context,
      } = ctx;
      if (!stream || typeof stream.getTracks !== "function") {
        throw new Error("OrbisPorcupineSdkHooksLocal.createSession requires a MediaStream");
      }
      if (typeof onDetection !== "function") {
        throw new Error("OrbisPorcupineSdkHooksLocal.createSession requires onDetection(...)");
      }

      const activeBridge = resolveBridge();
      if (!activeBridge) {
        throw new Error("OrbisPorcupineSdkBridge is not installed");
      }

      const session = await activeBridge.createSession({
        stream,
        keywords,
        onDetection,
        onError,
        context,
      });

      return {
        start: () => session && session.start && session.start(),
        stop: () => session && session.stop && session.stop(),
        destroy: () => session && session.destroy && session.destroy(),
        getStatus: () => (session && session.getStatus ? session.getStatus() : { ok: true, bridge: true }),
      };
    },
  };

  return window.OrbisPorcupineSdkHooks;
}

export function getOrbisPorcupineSdkBridgeStatus() {
  const bridge = resolveBridge();
  if (!bridge) return { installed: false };
  return {
    installed: true,
    hasCreateSession: typeof bridge.createSession === "function",
    status: typeof bridge.getStatus === "function" ? bridge.getStatus() : null,
  };
}

