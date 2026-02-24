/**
 * Dev-only openWakeWord local sidecar config (browser -> localhost WebSocket).
 *
 * This config is intentionally isolated from the core KWS parser/provider logic so
 * we can replace the backend implementation later without touching gameplay code.
 */

export const OPENWAKEWORD_SIDECAR_CONFIG_DEFAULT = Object.freeze({
  enabled: true,
  label: "openwakeword-sidecar",
  wsUrl: "ws://127.0.0.1:8765",
  reconnectMs: 1200,
  requestStartOnConnect: true,
  // Optional token label normalization if the sidecar emits labels that differ from parser tokens.
  tokenMap: Object.freeze({
    // "IgnisWake": "ignis",
  }),
});

