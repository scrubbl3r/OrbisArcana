/**
 * Vendor-agnostic Porcupine SDK hook template.
 *
 * Install this (or your real implementation) on:
 *   window.OrbisPorcupineSdkHooks
 *
 * The global session wrapper (`porcupine-sdk-session-global.js`) will call:
 *   OrbisPorcupineSdkHooks.createSession(...)
 */

/**
 * Installs a template hook object with a `createSession(...)` contract.
 * Replace the TODOs with real Porcupine Web SDK integration calls.
 */
export function installOrbisPorcupineSdkHooksTemplate() {
  if (typeof window === "undefined") return null;

  window.OrbisPorcupineSdkHooks = {
    /**
     * @param {{
     *   stream: MediaStream,
     *   keywords: Array<{token:string,label?:string,modelPath?:string}>,
     *   onDetection: Function,
     *   onError?: Function,
     *   context?: { keywordLookup?: any }
     * }} ctx
     */
    async createSession(ctx = {}) {
      const {
        stream,
        keywords = [],
        onDetection,
        onError,
        context,
      } = ctx;

      if (!stream || typeof stream.getTracks !== "function") {
        throw new Error("OrbisPorcupineSdkHooks.createSession requires a MediaStream");
      }
      if (typeof onDetection !== "function") {
        throw new Error("OrbisPorcupineSdkHooks.createSession requires onDetection(...)");
      }

      let started = false;
      let lastError = "";
      let errorCount = 0;
      let lastDetection = null;

      function report(err) {
        errorCount += 1;
        lastError = err && err.message ? String(err.message) : String(err || "unknown_error");
        if (typeof onError === "function") onError(err);
      }

      // =====================================================================
      // TODO (REAL SDK WIRING):
      // 1. Load/create Porcupine SDK detector using `keywords[].modelPath`.
      // 2. Attach detector to the provided `stream`.
      // 3. Map detections to:
      //      onDetection({ token, confidence, atMs })
      //
      // `context.keywordLookup` can help map SDK-returned labels/indexes back to
      // canonical tokens if needed.
      // =====================================================================

      return {
        async start() {
          if (started) return;
          // TODO: start real SDK processing
          throw new Error("OrbisPorcupineSdkHooks template is not implemented");
        },
        async stop() {
          if (!started) return;
          // TODO: stop real SDK processing
          started = false;
        },
        async destroy() {
          // TODO: cleanup SDK resources
          started = false;
        },
        getStatus() {
          return {
            ok: true,
            template: true,
            started,
            keywordCount: Array.isArray(keywords) ? keywords.length : 0,
            lastDetection,
            errorCount,
            lastError,
          };
        },
        _emitDetectionForDebug(keywordOrToken, confidence = 1) {
          const raw = String(keywordOrToken || "").trim().toLowerCase();
          if (!raw) return;
          const lookup = context && context.keywordLookup;
          const mapped = lookup && ((lookup.byLabel && lookup.byLabel.get(raw)) || (lookup.byToken && lookup.byToken.get(raw)));
          const token = mapped ? mapped.token : raw;
          lastDetection = {
            token,
            confidence: Number.isFinite(Number(confidence)) ? Number(confidence) : 1,
            atMs: Date.now(),
          };
          onDetection(lastDetection);
        },
        _reportErrorForDebug(err) {
          report(err);
        },
      };
    },
  };

  return window.OrbisPorcupineSdkHooks;
}

