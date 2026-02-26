import { OPENWAKEWORD_SIDECAR_CONFIG_DEFAULT } from "./openwakeword-sidecar-config.js";

function nowMs() {
  return (typeof performance !== "undefined" && typeof performance.now === "function")
    ? performance.now()
    : Date.now();
}

function normalizeToken(rawToken, tokenMap = {}) {
  const key = String(rawToken || "").trim();
  if (!key) return "";
  const mapped = Object.prototype.hasOwnProperty.call(tokenMap, key) ? tokenMap[key] : key;
  return String(mapped || "").trim().toLowerCase();
}

/**
 * Create a dev-only openWakeWord sidecar backend factory for `createKwsProvider(...)`.
 *
 * The backend speaks a tiny WebSocket JSON protocol and emits normalized KWS token hits
 * through `onToken(...)`, which are then handled by the existing parser/provider path.
 *
 * Supported inbound message examples:
 * - `{ "type":"token_detected", "token":"ignis", "confidence":0.91, "atMs":12345 }`
 * - `{ "type":"status", "running":true, "backend":"openwakeword" }`
 *
 * Supported outbound messages:
 * - `{ "type":"start" }`
 * - `{ "type":"stop" }`
 * - `{ "type":"ping" }`
 *
 * @param {Partial<typeof OPENWAKEWORD_SIDECAR_CONFIG_DEFAULT>} [cfg]
 */
export function createOpenWakeWordSidecarBackendFactory(cfg = {}) {
  const config = {
    ...OPENWAKEWORD_SIDECAR_CONFIG_DEFAULT,
    ...(cfg && typeof cfg === "object" ? cfg : {}),
  };
  const tokenMap = (config.tokenMap && typeof config.tokenMap === "object") ? config.tokenMap : {};

  return async function openWakeWordSidecarBackendFactory(ctx = {}) {
    const onToken = typeof ctx.onToken === "function" ? ctx.onToken : () => {};
    const onError = typeof ctx.onError === "function" ? ctx.onError : () => {};

    let ws = null;
    let connected = false;
    let started = false;
    let closedByClient = false;
    let reconnectTimer = null;
    let lastError = "";
    let lastStatusMsg = null;
    let lastToken = "";
    let reconnectAttempts = 0;

    function clearReconnectTimer() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function emitError(err) {
      lastError = err && err.message ? String(err.message) : String(err || "sidecar_error");
      try { onError(err instanceof Error ? err : new Error(lastError)); } catch {}
    }

    function sendJson(obj) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try {
        ws.send(JSON.stringify(obj));
        return true;
      } catch (err) {
        emitError(err);
        return false;
      }
    }

    function scheduleReconnect() {
      if (closedByClient) return;
      clearReconnectTimer();
      const delay = Math.max(100, Number(config.reconnectMs) || 1200);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, delay);
    }

    function handleMessage(raw) {
      let msg = null;
      try {
        msg = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (err) {
        emitError(new Error("oww_sidecar_bad_json"));
        return;
      }
      if (!msg || typeof msg !== "object") return;
      const type = String(msg.type || "");
      if (type === "status") {
        lastStatusMsg = msg;
        return;
      }
      if (type === "error") {
        const message = String(msg.message || "oww_sidecar_error");
        emitError(new Error(message));
        return;
      }
      if (type === "token_detected") {
        const token = normalizeToken(msg.token, tokenMap);
        if (!token) return;
        const confidence = Number.isFinite(Number(msg.confidence)) ? Number(msg.confidence) : 0.9;
        const atMs = Number.isFinite(Number(msg.atMs)) ? Number(msg.atMs) : nowMs();
        lastToken = token;
        onToken({ token, confidence, atMs });
        return;
      }
    }

    async function handleMessageEvent(ev) {
      const data = ev && Object.prototype.hasOwnProperty.call(ev, "data") ? ev.data : ev;
      try {
        if (typeof data === "string") {
          handleMessage(data);
          return;
        }
        if (typeof Blob !== "undefined" && data instanceof Blob) {
          handleMessage(await data.text());
          return;
        }
        if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
          handleMessage(new TextDecoder().decode(data));
          return;
        }
        if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(data)) {
          handleMessage(new TextDecoder().decode(data));
          return;
        }
        handleMessage(data);
      } catch (err) {
        emitError(err instanceof Error ? err : new Error("oww_sidecar_message_decode_failed"));
      }
    }

    async function connect() {
      if (closedByClient) return true;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return true;
      }
      if (typeof WebSocket !== "function") {
        emitError(new Error("websocket_unavailable"));
        return false;
      }
      const wsUrl = String(config.wsUrl || OPENWAKEWORD_SIDECAR_CONFIG_DEFAULT.wsUrl);
      const pageProtocol = (typeof window !== "undefined" && window.location)
        ? String(window.location.protocol || "").toLowerCase()
        : "";
      if (pageProtocol === "https:" && /^ws:\/\//i.test(wsUrl)) {
        emitError(new Error("oww_sidecar_requires_wss_on_https"));
        return false;
      }
      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        emitError(err);
        scheduleReconnect();
        return false;
      }

      return await new Promise((resolve) => {
        let settled = false;
        const finish = (ok) => {
          if (settled) return;
          settled = true;
          resolve(!!ok);
        };
        ws.addEventListener("open", () => {
          connected = true;
          reconnectAttempts = 0;
          lastError = "";
          if (config.requestStartOnConnect) sendJson({ type: "start" });
          finish(true);
        }, { once: true });
        ws.addEventListener("message", (ev) => {
          void handleMessageEvent(ev);
        });
        ws.addEventListener("error", () => {
          emitError(new Error("oww_sidecar_socket_error"));
        });
        ws.addEventListener("close", () => {
          connected = false;
          if (!closedByClient) {
            reconnectAttempts += 1;
            scheduleReconnect();
          }
        });
        // Safety timeout for initial connect
        setTimeout(() => {
          if (!connected && !lastError) {
            emitError(new Error("oww_sidecar_connect_timeout"));
          }
          finish(connected);
        }, 2500);
      });
    }

    async function start() {
      closedByClient = false;
      started = true;
      const ok = await connect();
      if (ok) sendJson({ type: "start" });
      return ok;
    }

    async function stop() {
      started = false;
      clearReconnectTimer();
      if (connected) sendJson({ type: "stop" });
      return true;
    }

    async function destroy() {
      started = false;
      closedByClient = true;
      clearReconnectTimer();
      if (ws) {
        try { ws.close(); } catch {}
      }
      ws = null;
      connected = false;
      return true;
    }

    function getStatus() {
      return {
        backend: "openwakeword-sidecar",
        label: String(config.label || "openwakeword-sidecar"),
        wsUrl: String(config.wsUrl || ""),
        connected,
        started,
        simulated: false,
        requiresMic: false,
        reconnectAttempts,
        lastError,
        lastToken,
        lastStatusMsg,
      };
    }

    return Object.freeze({
      start,
      stop,
      destroy,
      getStatus,
      sendJson,
    });
  };
}
