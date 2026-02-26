/**
 * Dev-only openWakeWord sidecar config (browser -> WebSocket).
 *
 * LAN-friendly behavior:
 * - `?owwHost=HOST` overrides sidecar host
 * - `?owwPort=PORT` overrides sidecar port
 * - otherwise uses current page hostname when non-localhost
 * - falls back to `127.0.0.1:8765` for local desktop testing
 */

function readUrlParams() {
  try {
    if (typeof window === "undefined" || !window.location) return null;
    return new URLSearchParams(String(window.location.search || ""));
  } catch {
    return null;
  }
}

function resolveOpenWakeWordSidecarWsUrl() {
  const params = readUrlParams();
  const hostOverride = String(params && params.get("owwHost") || "").trim();
  const portOverrideRaw = String(params && params.get("owwPort") || "").trim();
  const portOverride = /^[0-9]{2,5}$/.test(portOverrideRaw) ? portOverrideRaw : "";

  let host = hostOverride;
  if (!host && typeof window !== "undefined" && window.location) {
    const pageHost = String(window.location.hostname || "").trim();
    const isLocal = pageHost === "localhost" || pageHost === "127.0.0.1";
    if (pageHost && !isLocal) host = pageHost;
  }
  if (!host) host = "127.0.0.1";

  const port = portOverride || "8765";
  return `ws://${host}:${port}`;
}

export const OPENWAKEWORD_SIDECAR_CONFIG_DEFAULT = Object.freeze({
  enabled: true,
  label: "openwakeword-sidecar",
  wsUrl: resolveOpenWakeWordSidecarWsUrl(),
  reconnectMs: 1200,
  requestStartOnConnect: true,
  // Optional token label normalization if the sidecar emits labels that differ from parser tokens.
  tokenMap: Object.freeze({
    // "IgnisWake": "ignis",
  }),
});
