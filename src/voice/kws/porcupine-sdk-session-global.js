/**
 * Global Porcupine SDK session wrapper skeleton.
 *
 * This file installs:
 *   window.OrbisCreatePorcupineSdkSession
 *
 * The receiver boot path (`porcupine-local-boot.js`) looks for this function.
 *
 * Replace the TODO sections with the actual Porcupine Web SDK calls once the
 * vendor SDK assets/models are added locally.
 */

/**
 * @typedef {Object} OrbisCreatePorcupineSdkSessionArgs
 * @property {MediaStream} stream
 * @property {Array<{token:string,label?:string,modelPath?:string}>} keywords
 * @property {(evt:{token?:string,keyword?:string,confidence?:number,score?:number,atMs?:number}) => void} onDetection
 * @property {(err:any) => void} [onError]
 */

/**
 * Install the global SDK session factory used by local Porcupine boot.
 *
 * Safe behavior:
 * - installs a valid function shape
 * - throws explicit "not implemented" errors until SDK wiring is filled in
 */
export function installOrbisCreatePorcupineSdkSessionGlobal() {
  if (typeof window === "undefined") return null;

  /**
   * @param {OrbisCreatePorcupineSdkSessionArgs} args
   */
  window.OrbisCreatePorcupineSdkSession = async function OrbisCreatePorcupineSdkSession(args = {}) {
    const {
      stream,
      keywords = [],
      onDetection,
      onError,
    } = args;

    if (!stream || typeof stream.getTracks !== "function") {
      throw new Error("OrbisCreatePorcupineSdkSession requires a MediaStream");
    }
    if (typeof onDetection !== "function") {
      throw new Error("OrbisCreatePorcupineSdkSession requires onDetection(...)");
    }

    let started = false;
    let destroyed = false;
    let errorCount = 0;
    let lastError = "";
    let lastDetection = null;

    // SDK/runtime handles (fill these in during real integration)
    let audioCtx = null;
    let sourceNode = null;
    let workletNode = null;
    let detector = null;

    function reportError(err) {
      errorCount += 1;
      lastError = err && err.message ? String(err.message) : String(err || "unknown_error");
      if (typeof onError === "function") onError(err);
    }

    async function initSdkAndGraphIfNeeded() {
      if (detector || workletNode || audioCtx) return;

      // =====================================================================
      // TODO: PORCUPINE WEB SDK INTEGRATION GOES HERE
      //
      // Typical responsibilities:
      // 1. Create/initialize Porcupine detector with keyword models.
      // 2. Create an AudioContext (or reuse one if SDK expects it).
      // 3. Attach MediaStream source -> processing node/worklet.
      // 4. Forward detections to `onDetection(...)`.
      //
      // Example detection callback mapping:
      //   onDetection({
      //     token: "ignis",          // normalized emitted token
      //     confidence: 0.92,        // optional
      //     atMs: Date.now(),
      //   });
      //
      // If your SDK returns a keyword index/name, map it using `keywords`.
      // =====================================================================

      throw new Error("Porcupine SDK session wrapper is not implemented yet");
    }

    async function start() {
      if (destroyed) throw new Error("Porcupine SDK session wrapper has been destroyed");
      if (started) return;
      try {
        await initSdkAndGraphIfNeeded();

        // TODO: Start detector/audio processing here (SDK-specific)
        // Example:
        // await detector.start?.();

        started = true;
      } catch (err) {
        reportError(err);
        throw err;
      }
    }

    async function stop() {
      if (!started) return;
      try {
        // TODO: Stop detector/audio processing here (SDK-specific)
        // Example:
        // await detector.stop?.();
      } catch (err) {
        reportError(err);
      } finally {
        started = false;
      }
    }

    async function destroy() {
      if (destroyed) return;
      try {
        await stop();

        // TODO: Cleanup SDK handles / audio graph here (SDK-specific)
        // Example:
        // workletNode?.disconnect();
        // sourceNode?.disconnect();
        // await detector?.release?.();
        // await audioCtx?.close?.();
      } catch (err) {
        reportError(err);
      } finally {
        detector = null;
        workletNode = null;
        sourceNode = null;
        audioCtx = null;
        destroyed = true;
      }
    }

    return Object.freeze({
      start,
      stop,
      destroy,
      getStatus() {
        return {
          ok: !destroyed,
          started,
          destroyed,
          keywordCount: Array.isArray(keywords) ? keywords.length : 0,
          lastDetection,
          errorCount,
          lastError,
        };
      },
      // Optional helper for SDK callback mapping while integrating.
      _emitDetectionForDebug(keywordOrToken, confidence = 1) {
        const token = String(keywordOrToken || "").trim().toLowerCase();
        if (!token) return;
        lastDetection = {
          token,
          confidence: Number.isFinite(Number(confidence)) ? Number(confidence) : 1,
          atMs: Date.now(),
        };
        onDetection(lastDetection);
      },
      _reportErrorForDebug(err) {
        reportError(err);
      },
    });
  };

  return window.OrbisCreatePorcupineSdkSession;
}

/**
 * Auto-install helper for direct module import.
 * Call this from a local dev boot script after the vendor SDK assets are loaded.
 */
export function autoInstallOrbisPorcupineSdkSessionGlobal() {
  return installOrbisCreatePorcupineSdkSessionGlobal();
}

