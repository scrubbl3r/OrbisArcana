/**
 * Dev-only openWakeWord sidecar config (browser -> WebSocket).
 *
 * LAN-friendly behavior:
 * - `?owwScheme=ws|wss` overrides WebSocket scheme
 * - `?owwHost=HOST` overrides sidecar host
 * - `?owwPort=PORT` overrides sidecar port
 * - otherwise uses current page hostname when non-localhost
 * - falls back to `127.0.0.1:8765` for local desktop testing
 * - defaults to `wss://` when the page is served over HTTPS, else `ws://`
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
  const schemeOverrideRaw = String(params && params.get("owwScheme") || "").trim().toLowerCase();
  const schemeOverride = (schemeOverrideRaw === "ws" || schemeOverrideRaw === "wss") ? schemeOverrideRaw : "";
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
  const pageProtocol = (typeof window !== "undefined" && window.location)
    ? String(window.location.protocol || "").toLowerCase()
    : "";
  const scheme = schemeOverride || (pageProtocol === "https:" ? "wss" : "ws");
  return `${scheme}://${host}:${port}`;
}

export const OPENWAKEWORD_SIDECAR_CONFIG_DEFAULT = Object.freeze({
  enabled: true,
  label: "openwakeword-sidecar",
  wsUrl: resolveOpenWakeWordSidecarWsUrl(),
  reconnectMs: 1200,
  requestStartOnConnect: true,
  // Optional token label normalization if the sidecar emits labels that differ from parser tokens.
  tokenMap: Object.freeze({
    // Canonicalize likely custom-model label variants.
    ingis: "ignis",
    firdgis: "fridgis",
  }),
});
