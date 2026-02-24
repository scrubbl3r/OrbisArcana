/**
 * Porcupine-style browser KWS backend adapter (SDK-agnostic skeleton).
 *
 * This bridges the receiver's `window.OrbisKwsBackendFactory` contract to a
 * concrete browser keyword detector implementation (for example Porcupine Web).
 *
 * Why this is SDK-agnostic:
 * - We don't hardcode a specific vendor API shape here.
 * - You provide `createDetectorSession(...)` that wraps the real SDK.
 *
 * Receiver-side contract already implemented:
 *   window.OrbisKwsBackendFactory = async ({ stream, onToken, onError }) => ({
 *     start(), stop(), getStatus()
 *   })
 */

/**
 * @typedef {Object} KwsBackendContext
 * @property {MediaStream} stream Live microphone stream
 * @property {(hit: {token:string, confidence?:number, atMs?:number}) => void} onToken
 * @property {(err: Error | {message?:string}|string) => void} [onError]
 */

/**
 * @typedef {Object} DetectorSession
 * @property {() => Promise<void>|void} [start]
 * @property {() => Promise<void>|void} [stop]
 * @property {() => Object} [getStatus]
 * @property {() => Promise<void>|void} [destroy]
 */

/**
 * Create a browser KWS backend factory compatible with `window.OrbisKwsBackendFactory`.
 *
 * You provide the actual SDK integration in `createDetectorSession`.
 * That callback should:
 * - consume the mic MediaStream
 * - call `onToken({ token, confidence, atMs })` on keyword hits
 * - call `onError(...)` on detector errors
 *
 * @param {{
 *   createDetectorSession: (ctx: KwsBackendContext) => Promise<DetectorSession>|DetectorSession,
 *   label?: string,
 * }} opts
 * @returns {(ctx: KwsBackendContext) => Promise<{start:Function, stop:Function, getStatus:Function}>}
 */
export function createPorcupineBrowserBackendFactory(opts = {}) {
  if (typeof opts.createDetectorSession !== "function") {
    throw new Error("createPorcupineBrowserBackendFactory requires createDetectorSession(ctx)");
  }

  const label = String(opts.label || "porcupine");

  return async function OrbisKwsBackendFactory(ctx = {}) {
    const { stream, onToken, onError } = ctx;
    if (!stream || typeof stream.getTracks !== "function") {
      throw new Error("KWS backend factory requires a MediaStream");
    }
    if (typeof onToken !== "function") {
      throw new Error("KWS backend factory requires onToken(hit)");
    }

    let started = false;
    let detectorSession = null;
    let lastTokenAtMs = 0;
    let lastToken = "";
    let errorCount = 0;

    function reportError(err) {
      errorCount += 1;
      if (typeof onError === "function") onError(err);
    }

    function guardedToken(hit) {
      try {
        const token = String(hit && hit.token || "").trim().toLowerCase();
        if (!token) return;
        lastToken = token;
        lastTokenAtMs = Number(hit && hit.atMs) || Date.now();
        onToken({
          token,
          confidence: Number.isFinite(Number(hit && hit.confidence)) ? Number(hit.confidence) : 1,
          atMs: lastTokenAtMs,
        });
      } catch (err) {
        reportError(err);
      }
    }

    try {
      detectorSession = await opts.createDetectorSession({
        stream,
        onToken: guardedToken,
        onError: reportError,
      });
    } catch (err) {
      reportError(err);
      throw err;
    }

    async function start() {
      if (started) return;
      started = true;
      if (detectorSession && typeof detectorSession.start === "function") {
        await detectorSession.start();
      }
    }

    async function stop() {
      if (!started) return;
      started = false;
      if (detectorSession && typeof detectorSession.stop === "function") {
        await detectorSession.stop();
      }
    }

    function getStatus() {
      const inner = detectorSession && typeof detectorSession.getStatus === "function"
        ? detectorSession.getStatus()
        : null;
      return {
        label,
        started,
        lastToken,
        lastTokenAtMs,
        errorCount,
        inner,
      };
    }

    return Object.freeze({
      start,
      stop,
      async destroy() {
        try { await stop(); } catch {}
        if (detectorSession && typeof detectorSession.destroy === "function") {
          try { await detectorSession.destroy(); } catch {}
        }
        detectorSession = null;
      },
      getStatus,
    });
  };
}

/**
 * Install a backend factory onto `window` so `game-receiver.js` can pick it up.
 *
 * @param {Parameters<typeof createPorcupineBrowserBackendFactory>[0]} opts
 * @returns {Function} The installed factory
 */
export function installPorcupineKwsBackendGlobal(opts = {}) {
  const factory = createPorcupineBrowserBackendFactory(opts);
  if (typeof window !== "undefined") {
    window.OrbisKwsBackendFactory = factory;
  }
  return factory;
}

/**
 * Example helper for wiring a generic detector adapter (pseudocode-level).
 *
 * Replace this with a real Porcupine Web SDK session wrapper in your local
 * integration file once the SDK/model assets are available.
 *
 * @param {{
 *   createSession: Function,
 *   keywords: Array<{ token: string, [key:string]:any }>,
 * }} deps
 */
export function installExamplePorcupineLikeBackend(deps = {}) {
  const createSession = deps && deps.createSession;
  const keywords = Array.isArray(deps && deps.keywords) ? deps.keywords : [];
  if (typeof createSession !== "function") {
    throw new Error("installExamplePorcupineLikeBackend requires createSession(...)");
  }

  return installPorcupineKwsBackendGlobal({
    label: "porcupine-like",
    async createDetectorSession({ stream, onToken, onError }) {
      // `createSession` is expected to return a detector wrapper that you define.
      // Your wrapper should call `onToken({ token, confidence, atMs })`.
      const session = await createSession({
        stream,
        keywords,
        onKeyword: ({ keyword, confidence }) => {
          onToken({
            token: String(keyword || "").toLowerCase(),
            confidence: Number.isFinite(Number(confidence)) ? Number(confidence) : 1,
            atMs: Date.now(),
          });
        },
        onError,
      });

      return {
        start: () => session && session.start && session.start(),
        stop: () => session && session.stop && session.stop(),
        destroy: () => session && session.destroy && session.destroy(),
        getStatus: () => session && session.getStatus ? session.getStatus() : { ok: true },
      };
    },
  });
}

