/**
 * Porcupine local bridge example (template)
 *
 * This file should install:
 *   window.OrbisPorcupineSdkBridge
 *
 * The local KWS boot path will auto-detect this bridge (via
 * `porcupine-sdk-hooks-local.js`) after the SDK script is loaded.
 *
 * Replace the TODO sections with actual Porcupine Web SDK calls.
 */

(function installOrbisPorcupineSdkBridgeExample(){
  if (typeof window === "undefined") return;

  window.OrbisPorcupineSdkBridge = {
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
        throw new Error("OrbisPorcupineSdkBridge.createSession requires a MediaStream");
      }
      if (typeof onDetection !== "function") {
        throw new Error("OrbisPorcupineSdkBridge.createSession requires onDetection(...)");
      }

      let started = false;
      let lastError = "";
      let errorCount = 0;
      let lastDetection = null;

      // TODO: Replace these placeholders with actual Porcupine SDK handles.
      let sdkInstance = null;
      let audioCtx = null;
      let sourceNode = null;
      let workletNode = null;

      function report(err) {
        errorCount += 1;
        lastError = err && err.message ? String(err.message) : String(err || "unknown_error");
        if (typeof onError === "function") onError(err);
      }

      function mapSdkDetectionToToken(evt = {}) {
        // Common SDK outputs may include keyword name, label, or index.
        const raw = String(evt.token || evt.keyword || evt.label || "").trim().toLowerCase();
        if (!raw && Number.isFinite(Number(evt.index)) && Array.isArray(keywords)) {
          const byIndex = keywords[Number(evt.index)];
          if (byIndex && byIndex.token) return String(byIndex.token).toLowerCase();
        }
        if (!raw) return "";
        const lookup = context && context.keywordLookup;
        const mapped = lookup && (
          (lookup.byLabel && lookup.byLabel.get(raw)) ||
          (lookup.byToken && lookup.byToken.get(raw))
        );
        return mapped ? String(mapped.token || raw) : raw;
      }

      async function initIfNeeded() {
        if (sdkInstance || audioCtx || sourceNode || workletNode) return;

        // ==============================================================
        // TODO: REAL PORCUPINE WEB SDK INTEGRATION
        //
        // Typical steps:
        // 1. Initialize SDK runtime (using local wasm/worker assets)
        // 2. Load keyword models from `keywords[].modelPath`
        // 3. Create detector instance
        // 4. Attach to mic MediaStream (`stream`)
        // 5. Forward detections:
        //    onDetection({
        //      token: mapSdkDetectionToToken(sdkEvt),
        //      confidence: sdkEvt.confidence ?? sdkEvt.score ?? 1,
        //      atMs: Date.now(),
        //    });
        // ==============================================================

        throw new Error("Porcupine bridge example is not implemented yet");
      }

      return {
        async start() {
          if (started) return;
          try {
            await initIfNeeded();
            // TODO: start detector/audio processing
            started = true;
          } catch (err) {
            report(err);
            throw err;
          }
        },
        async stop() {
          if (!started) return;
          try {
            // TODO: stop detector/audio processing
          } catch (err) {
            report(err);
          } finally {
            started = false;
          }
        },
        async destroy() {
          try {
            await this.stop();
            // TODO: cleanup SDK/audio resources
          } catch (err) {
            report(err);
          } finally {
            sdkInstance = null;
            workletNode = null;
            sourceNode = null;
            audioCtx = null;
          }
        },
        getStatus() {
          return {
            ok: true,
            bridge: "example",
            started,
            keywordCount: Array.isArray(keywords) ? keywords.length : 0,
            keywords: Array.isArray(keywords) ? keywords.map((k) => ({ token: k.token, modelPath: k.modelPath || null })) : [],
            lastDetection,
            errorCount,
            lastError,
          };
        },
        // Optional debug helpers while wiring SDK:
        _emitDetectionForDebug(keywordOrToken, confidence = 1) {
          const token = mapSdkDetectionToToken({ token: keywordOrToken });
          if (!token) return;
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

    getStatus() {
      return {
        installed: true,
        example: true,
        hasCreateSession: true,
      };
    },
  };
})();

