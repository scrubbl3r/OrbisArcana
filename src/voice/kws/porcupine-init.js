import { installOrbisPorcupineWebAdapter } from "./porcupine-web-sdk-adapter.js";

/**
 * Local-first Porcupine asset manifest (paths only).
 * These are placeholders until the SDK + model files are added.
 */
export const PORCUPINE_LOCAL_ASSET_MANIFEST = Object.freeze({
  sdk: {
    version: "UNSET",
    basePath: "/vendor/porcupine/UNSET/",
    scriptPath: "/vendor/porcupine/UNSET/porcupine.js",
    wasmPath: "/vendor/porcupine/UNSET/porcupine.wasm",
    workerPath: "/vendor/porcupine/UNSET/porcupine-worker.js",
  },
  keywords: Object.freeze({
    ignis: "/assets/kws/keywords/ignis.ppn",
    fridgis: "/assets/kws/keywords/fridgis.ppn",
    electrum: "/assets/kws/keywords/electrum.ppn",
    sanctum: "/assets/kws/keywords/sanctum.ppn",
    sanctus: "/assets/kws/keywords/sanctus.ppn",
    radius: "/assets/kws/keywords/radius.ppn",
    rota: "/assets/kws/keywords/rota.ppn",
    rahta: "/assets/kws/keywords/rahta.ppn",
    domus: "/assets/kws/keywords/domus.ppn",
  }),
});

let porcupineInitState = {
  attempted: false,
  installed: false,
  reason: "not_attempted",
};

export function getPorcupineInitStatus() {
  return { ...porcupineInitState };
}

async function defaultCreateSdkSessionNotInstalled() {
  throw new Error("Porcupine SDK local integration not installed yet (createSdkSession missing)");
}

/**
 * Best-effort local Porcupine KWS backend install.
 *
 * Safe by design:
 * - If local SDK assets are not present yet, returns `{ installed:false }`
 * - Does not break the existing STT voice path
 *
 * @param {{
 *   createSdkSession?: Function,
 *   label?: string,
 *   keywords?: Array<Object>,
 * }} [opts]
 */
export async function initLocalPorcupineKwsBackend(opts = {}) {
  if (porcupineInitState.installed) {
    return { installed: true, status: getPorcupineInitStatus() };
  }
  porcupineInitState = {
    attempted: true,
    installed: false,
    reason: "starting",
  };

  try {
    const createSdkSession = typeof opts.createSdkSession === "function"
      ? opts.createSdkSession
      : defaultCreateSdkSessionNotInstalled;

    installOrbisPorcupineWebAdapter({
      label: String(opts.label || "porcupine-web-local"),
      createSdkSession,
      keywords: Array.isArray(opts.keywords) ? opts.keywords : undefined,
    });

    porcupineInitState = {
      attempted: true,
      installed: true,
      reason: "installed",
    };
    return { installed: true, status: getPorcupineInitStatus() };
  } catch (err) {
    porcupineInitState = {
      attempted: true,
      installed: false,
      reason: err && err.message ? String(err.message) : "init_failed",
    };
    return { installed: false, status: getPorcupineInitStatus(), error: err };
  }
}

