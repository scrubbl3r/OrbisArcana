import { createKwsTokenParser } from "../kws/kws-token-parser.js";

/**
 * Mock/test KWS provider wrapper.
 *
 * This does not implement real audio keyword spotting yet. It provides a
 * provider-compatible surface and forwards token hits into the KWS token parser.
 * Useful for shadow-mode development and keyboard/dev-console simulation.
 *
 * @param {{
 *   eventBus?: { emit?: Function },
 *   parser?: ReturnType<typeof createKwsTokenParser>,
 *   shadow?: boolean,
 *   parserConfig?: object,
 *   audioBackendFactory?: Function,
 * }} [opts]
 */
export function createKwsProvider(opts = {}) {
  const eventBus = opts.eventBus || null;
  const parser = opts.parser || createKwsTokenParser({
    eventBus,
    shadow: opts.shadow == null ? true : !!opts.shadow,
    ...(opts.parserConfig && typeof opts.parserConfig === "object" ? opts.parserConfig : {}),
  });

  let enabled = false;
  let started = false;
  let mode = "shadow";
  let micEnabled = false;
  let micRunning = false;
  let micError = "";
  let micStream = null;
  let audioBackend = null;

  function start() {
    started = true;
  }

  function stop() {
    started = false;
  }

  function destroy() {
    started = false;
    enabled = false;
    void stopMic();
    parser.reset();
  }

  function setEnabled(next) {
    enabled = !!next;
    parser.setEnabled(enabled);
  }

  function setMode(nextMode) {
    mode = String(nextMode || "shadow");
    parser.setMode(mode === "kws" || mode === "active" ? "active" : "shadow");
  }

  async function startMic() {
    if (micRunning) return true;
    micError = "";
    if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      micError = "getUserMedia_unavailable";
      return false;
    }
    if (typeof opts.audioBackendFactory !== "function") {
      micError = "no_audio_backend_factory";
      return false;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
      const maybeBackend = await opts.audioBackendFactory({
        stream: micStream,
        onToken: (hit) => ingestTokenHit(hit),
        onError: (err) => {
          micError = err && err.message ? String(err.message) : "audio_backend_error";
        },
      });
      audioBackend = maybeBackend || null;
      if (audioBackend && typeof audioBackend.start === "function") {
        await audioBackend.start();
      }
      micRunning = true;
      micEnabled = true;
      return true;
    } catch (err) {
      micError = err && err.name ? String(err.name) : "mic_start_failed";
      if (micStream) {
        try { micStream.getTracks().forEach((t) => t.stop()); } catch {}
      }
      micStream = null;
      audioBackend = null;
      micRunning = false;
      return false;
    }
  }

  async function stopMic() {
    micEnabled = false;
    micRunning = false;
    if (audioBackend && typeof audioBackend.stop === "function") {
      try { await audioBackend.stop(); } catch {}
    }
    audioBackend = null;
    if (micStream) {
      try { micStream.getTracks().forEach((t) => t.stop()); } catch {}
    }
    micStream = null;
    return true;
  }

  async function setMicEnabled(next) {
    if (next) return startMic();
    return stopMic();
  }

  /**
   * Dev/test helper: inject a token hit without real audio KWS.
   * @param {{token:string, confidence?:number, atMs?:number}} hit
   */
  function ingestTokenHit(hit) {
    if (!enabled || !started) return { matched: false, reason: "provider_inactive" };
    return parser.ingestToken({
      ...hit,
      providerId: "kws",
    });
  }

  function getStatus() {
    return {
      id: "kws",
      enabled,
      started,
      mode,
      micEnabled,
      micRunning,
      micError,
      hasAudioBackendFactory: typeof opts.audioBackendFactory === "function",
      audioBackendStatus: audioBackend && typeof audioBackend.getStatus === "function" ? audioBackend.getStatus() : null,
      parser: parser.getStatus(),
    };
  }

  function setParserConfig(next = {}) {
    if (parser && typeof parser.setConfig === "function") {
      return parser.setConfig(next);
    }
    return getStatus();
  }

  return Object.freeze({
    id: "kws",
    start,
    stop,
    destroy,
    setEnabled,
    setMode,
    setParserConfig,
    startMic,
    stopMic,
    setMicEnabled,
    getStatus,
    ingestTokenHit,
    parser,
  });
}
