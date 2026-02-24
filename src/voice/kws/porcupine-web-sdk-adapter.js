import { installPorcupineKwsBackendGlobal } from "./porcupine-browser-backend.js";

/**
 * Project-local Porcupine Web SDK adapter skeleton.
 *
 * This file is the concrete place to integrate the real Porcupine browser SDK
 * and keyword models for Orbis Arcana. It intentionally contains no SDK import
 * yet, so it is safe to commit before you decide on bundling/CDN/model loading.
 *
 * The goal is to map Porcupine detections -> normalized `onToken(...)` calls.
 */

/**
 * @typedef {Object} OrbisKwsKeywordConfig
 * @property {string} token Normalized token emitted to the parser (`ignis`, `rota`, etc.)
 * @property {string} [label] Human label/debug label
 * @property {any} [model] SDK-specific keyword model/asset reference
 * @property {number} [sensitivity] Optional SDK sensitivity
 */

/**
 * @typedef {Object} OrbisPorcupineAdapterOptions
 * @property {Function} [createSdkSession]
 * SDK-specific factory that returns a session wrapper. You implement this when
 * wiring the real Porcupine SDK.
 * Expected callback signature:
 *   async ({ stream, keywords, onDetection, onError }) => {
 *     start(), stop(), destroy(), getStatus()
 *   }
 *
 * @property {OrbisKwsKeywordConfig[]} [keywords]
 * @property {string} [label]
 */

export const ORBIS_KWS_KEYWORDS_DEFAULT = Object.freeze([
  { token: "ignis", label: "Ignis" },
  { token: "fridgis", label: "Fridgis" },
  { token: "electrum", label: "Electrum" },
  { token: "sanctum", label: "Sanctum" },
  { token: "sanctus", label: "Sanctus" },
  { token: "radius", label: "Radius" },
  { token: "rota", label: "Rota" },
  { token: "rahta", label: "Rahta" },
  { token: "domus", label: "Domus" },
]);

/**
 * Install the global KWS backend factory using a project-local Porcupine SDK
 * wrapper.
 *
 * Until `createSdkSession` is provided, this installs a backend that reports a
 * clear error when KWS Mic is toggled on.
 *
 * @param {OrbisPorcupineAdapterOptions} [opts]
 * @returns {Function} Installed `window.OrbisKwsBackendFactory`
 */
export function installOrbisPorcupineWebAdapter(opts = {}) {
  const label = String(opts.label || "porcupine-web");
  const keywords = Array.isArray(opts.keywords) && opts.keywords.length
    ? opts.keywords
    : ORBIS_KWS_KEYWORDS_DEFAULT;
  const createSdkSession = typeof opts.createSdkSession === "function"
    ? opts.createSdkSession
    : null;

  return installPorcupineKwsBackendGlobal({
    label,
    async createDetectorSession({ stream, onToken, onError }) {
      if (!createSdkSession) {
        const err = new Error("Porcupine Web SDK adapter is not configured (missing createSdkSession)");
        if (typeof onError === "function") onError(err);
        throw err;
      }

      const sdkSession = await createSdkSession({
        stream,
        keywords,
        onDetection: ({ token, keyword, confidence, score, atMs } = {}) => {
          const normalized = String(token || keyword || "").trim().toLowerCase();
          if (!normalized) return;
          const conf = Number.isFinite(Number(confidence))
            ? Number(confidence)
            : (Number.isFinite(Number(score)) ? Number(score) : 1);
          onToken({
            token: normalized,
            confidence: conf,
            atMs: Number(atMs) || Date.now(),
          });
        },
        onError,
      });

      return {
        start: () => sdkSession && sdkSession.start && sdkSession.start(),
        stop: () => sdkSession && sdkSession.stop && sdkSession.stop(),
        destroy: () => sdkSession && sdkSession.destroy && sdkSession.destroy(),
        getStatus: () => (sdkSession && sdkSession.getStatus ? sdkSession.getStatus() : { ok: true, label }),
      };
    },
  });
}

/**
 * Example one-liner for local dev experiments.
 *
 * Usage (after you implement/create `createSdkSession`):
 *   import { installOrbisPorcupineWebAdapter } from "./src/voice/kws/porcupine-web-sdk-adapter.js";
 *   installOrbisPorcupineWebAdapter({ createSdkSession });
 */
export function installOrbisPorcupineWebAdapterFromGlobal(factoryName = "OrbisCreatePorcupineSdkSession") {
  const createSdkSession = (typeof window !== "undefined" && typeof window[factoryName] === "function")
    ? window[factoryName]
    : null;
  return installOrbisPorcupineWebAdapter({ createSdkSession });
}

