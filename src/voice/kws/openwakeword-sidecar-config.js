/**
 * Dev-only openWakeWord sidecar config (browser -> WebSocket).
 *
 * LAN-friendly behavior:
 * - uses current page hostname when non-localhost
 * - falls back to `127.0.0.1:8765` for local desktop testing
 * - defaults to `wss://` when the page is served over HTTPS, else `ws://`
 */

function resolveOpenWakeWordSidecarWsUrl() {
  let host = "";
  if (typeof window !== "undefined" && window.location) {
    const pageHost = String(window.location.hostname || "").trim();
    const isLocal = pageHost === "localhost" || pageHost === "127.0.0.1";
    if (pageHost && !isLocal) host = pageHost;
  }
  if (!host) host = "127.0.0.1";

  const port = "8765";
  const pageProtocol = (typeof window !== "undefined" && window.location)
    ? String(window.location.protocol || "").toLowerCase()
    : "";
  const scheme = pageProtocol === "https:" ? "wss" : "ws";
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
    ingis: "tempus",
    igins: "tempus",
    ignuss: "tempus",
    ignus: "tempus",
    firdgis: "fridgis",
  }),
});
