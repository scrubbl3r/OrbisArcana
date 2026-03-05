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
 *   tokenDedupMs?: number,
 *   audioBackendFactory?: Function,
 *   backendFactory?: Function,
 *   backendConfig?: { requiresMic?: boolean, label?: string },
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
  let backendFactory = (typeof opts.backendFactory === "function")
    ? opts.backendFactory
    : (typeof opts.audioBackendFactory === "function" ? opts.audioBackendFactory : null);
  let backendRequiresMic = !!(opts.backendConfig && opts.backendConfig.requiresMic != null
    ? opts.backendConfig.requiresMic
    : true);
  let backendLabel = String(opts.backendConfig && opts.backendConfig.label || "kws-backend");
  const configuredTokenDedupMs = Number.isFinite(Number(opts.tokenDedupMs))
    ? Math.max(0, Math.round(Number(opts.tokenDedupMs)))
    : null;
  const lastAcceptedTokenAtMsByToken = Object.create(null);
  let dedupDrops = 0;

  function clearTokenDedupState() {
    for (const k of Object.keys(lastAcceptedTokenAtMsByToken)) delete lastAcceptedTokenAtMsByToken[k];
    dedupDrops = 0;
  }

  function normalizeToken(raw) {
    return String(raw || "").trim().toLowerCase();
  }

  function resolveTokenDedupMs() {
    if (configuredTokenDedupMs != null) return configuredTokenDedupMs;
    const backendStatus = audioBackend && typeof audioBackend.getStatus === "function"
      ? audioBackend.getStatus()
      : null;
    const cooldown = Number(backendStatus && backendStatus.inferCooldownMs);
    return Number.isFinite(cooldown) ? Math.max(0, Math.round(cooldown)) : 0;
  }

  function start() {
    started = true;
  }

  function stop() {
    started = false;
    clearTokenDedupState();
  }

  function destroy() {
    started = false;
    enabled = false;
    void stopMic();
    clearTokenDedupState();
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
    if (typeof backendFactory !== "function") {
      micError = "no_audio_backend_factory";
      return false;
    }
    try {
      if (backendRequiresMic) {
        if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
          micError = "getUserMedia_unavailable";
          return false;
        }
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        });
      } else {
        micStream = null;
      }
      const maybeBackend = await backendFactory({
        stream: micStream,
        onToken: (hit) => ingestTokenHit(hit),
        onError: (err) => {
          micError = err && err.message ? String(err.message) : "audio_backend_error";
        },
      });
      audioBackend = maybeBackend || null;
      if (audioBackend && typeof audioBackend.start === "function") {
        const startOk = await audioBackend.start();
        if (startOk === false) {
          micError = micError || "audio_backend_start_failed";
          throw new Error("audio_backend_start_failed");
        }
      }
      micRunning = true;
      micEnabled = true;
      return true;
    } catch (err) {
      micError = micError || (err && err.message ? String(err.message) : (err && err.name ? String(err.name) : "mic_start_failed"));
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
    clearTokenDedupState();
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
    const token = normalizeToken(hit && hit.token);
    const atMs = Number(hit && hit.atMs) || Date.now();
    const dedupMs = resolveTokenDedupMs();
    if (token && dedupMs > 0) {
      const lastAt = Number(lastAcceptedTokenAtMsByToken[token] || 0);
      if ((atMs - lastAt) < dedupMs) {
        dedupDrops += 1;
        return { matched: false, reason: "provider_token_dedup", token, atMs, dedupMs };
      }
    }
    const result = parser.ingestToken({
      ...hit,
      token,
      atMs,
      providerId: "kws",
    });
    if (token && dedupMs > 0) {
      const reason = String(result && result.reason || "");
      const accepted = reason !== "below_token_threshold" && reason !== "empty" && reason !== "disabled";
      if (accepted) lastAcceptedTokenAtMsByToken[token] = atMs;
    }
    return result;
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
      hasBackendFactory: typeof backendFactory === "function",
      backendRequiresMic,
      backendLabel,
      tokenDedupMs: resolveTokenDedupMs(),
      tokenDedupDrops: dedupDrops,
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

  function setBackendConfig(next = {}) {
    if (audioBackend && typeof audioBackend.setConfig === "function") {
      try {
        audioBackend.setConfig(next);
      } catch (err) {
        micError = err && err.message ? String(err.message) : "audio_backend_set_config_failed";
      }
    }
    return getStatus();
  }

  async function setBackend(nextFactory, nextConfig = {}) {
    const wasMicRunning = !!micRunning;
    const shouldResume = wasMicRunning || !!micEnabled;
    if (wasMicRunning) {
      try { await stopMic(); } catch {}
    }
    backendFactory = (typeof nextFactory === "function") ? nextFactory : null;
    if (Object.prototype.hasOwnProperty.call(nextConfig, "requiresMic")) {
      backendRequiresMic = !!nextConfig.requiresMic;
    }
    if (Object.prototype.hasOwnProperty.call(nextConfig, "label")) {
      backendLabel = String(nextConfig.label || backendLabel || "kws-backend");
    }
    micError = "";
    if (shouldResume && typeof backendFactory === "function") {
      return startMic();
    }
    return true;
  }

  return Object.freeze({
    id: "kws",
    start,
    stop,
    destroy,
    setEnabled,
    setMode,
    setParserConfig,
    setBackendConfig,
    setBackend,
    startMic,
    stopMic,
    setMicEnabled,
    getStatus,
    ingestTokenHit,
    parser,
  });
}
