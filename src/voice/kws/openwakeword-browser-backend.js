import { OPENWAKEWORD_BROWSER_CONFIG_DEFAULT } from "./openwakeword-browser-config.js";

const SIM_TOKENS = Object.freeze(["ignis", "rota", "electrum", "sanctum", "domus"]);

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

export function createOpenWakeWordBrowserBackendFactory(cfg = {}) {
  const config = {
    ...OPENWAKEWORD_BROWSER_CONFIG_DEFAULT,
    ...(cfg && typeof cfg === "object" ? cfg : {}),
  };
  const tokenMap = (config.tokenMap && typeof config.tokenMap === "object") ? config.tokenMap : {};

  return async function openWakeWordBrowserBackendFactory(ctx = {}) {
    const onToken = typeof ctx.onToken === "function" ? ctx.onToken : () => {};
    const onError = typeof ctx.onError === "function" ? ctx.onError : () => {};

    let started = false;
    let running = false;
    let connected = false;
    let simulated = !!config.simulate;
    let simulationTimer = null;
    let lastError = "";
    let lastToken = "";
    let lastTokenAtMs = 0;
    let tokensEmitted = 0;

    function emitError(message) {
      lastError = String(message || "oww_browser_error");
      try { onError(new Error(lastError)); } catch {}
    }

    function clearSimulationTimer() {
      if (!simulationTimer) return;
      clearInterval(simulationTimer);
      simulationTimer = null;
    }

    function emitToken(token, confidence = 0.9) {
      const normalized = normalizeToken(token, tokenMap);
      if (!normalized) return;
      const atMs = nowMs();
      lastToken = normalized;
      lastTokenAtMs = atMs;
      tokensEmitted += 1;
      onToken({ token: normalized, confidence, atMs });
    }

    async function start() {
      started = true;
      running = true;
      connected = true;
      lastError = "";

      if (simulated) {
        clearSimulationTimer();
        const intervalMs = Math.max(200, Number(config.simulationIntervalMs) || 1400);
        simulationTimer = setInterval(() => {
          const token = SIM_TOKENS[Math.floor(Math.random() * SIM_TOKENS.length)];
          emitToken(token, 0.85);
        }, intervalMs);
        return true;
      }

      running = false;
      connected = false;
      emitError("oww_browser_not_implemented_yet");
      return false;
    }

    async function stop() {
      started = false;
      running = false;
      connected = false;
      clearSimulationTimer();
      return true;
    }

    async function destroy() {
      return stop();
    }

    function getStatus() {
      return {
        backend: "openwakeword-browser",
        label: String(config.label || "openwakeword-browser"),
        connected,
        started,
        running,
        simulated,
        requiresMic: true,
        lastError,
        lastToken,
        lastTokenAtMs,
        tokensEmitted,
      };
    }

    return Object.freeze({
      start,
      stop,
      destroy,
      getStatus,
    });
  };
}
