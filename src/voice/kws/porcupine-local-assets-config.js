/**
 * Local-bundle Porcupine asset layout (SSOT for file paths and version pinning).
 *
 * Update these values when you add the real local SDK/runtime/model assets.
 */

export const PORCUPINE_LOCAL_SDK_VERSION = "4.0.0";

export const PORCUPINE_LOCAL_VENDOR_BASE = `/vendor/porcupine/${PORCUPINE_LOCAL_SDK_VERSION}/`;
export const PORCUPINE_LOCAL_KEYWORDS_BASE = "/assets/kws/keywords/";

export const PORCUPINE_LOCAL_SDK_ASSETS = Object.freeze({
  version: PORCUPINE_LOCAL_SDK_VERSION,
  basePath: PORCUPINE_LOCAL_VENDOR_BASE,
  scriptPath: `${PORCUPINE_LOCAL_VENDOR_BASE}porcupine.js`,
  bridgeScriptPath: `${PORCUPINE_LOCAL_VENDOR_BASE}bridge-example.js`,
  wasmPath: `${PORCUPINE_LOCAL_VENDOR_BASE}porcupine.wasm`,
  workerPath: `${PORCUPINE_LOCAL_VENDOR_BASE}porcupine-worker.js`,
});

export const PORCUPINE_LOCAL_KEYWORD_MODEL_PATHS = Object.freeze({
  ignis: `${PORCUPINE_LOCAL_KEYWORDS_BASE}ignis.ppn`,
  fridgis: `${PORCUPINE_LOCAL_KEYWORDS_BASE}fridgis.ppn`,
  electrum: `${PORCUPINE_LOCAL_KEYWORDS_BASE}electrum.ppn`,
  sanctum: `${PORCUPINE_LOCAL_KEYWORDS_BASE}sanctum.ppn`,
  sanctus: `${PORCUPINE_LOCAL_KEYWORDS_BASE}sanctus.ppn`,
  radius: `${PORCUPINE_LOCAL_KEYWORDS_BASE}radius.ppn`,
  rota: `${PORCUPINE_LOCAL_KEYWORDS_BASE}rota.ppn`,
  rahta: `${PORCUPINE_LOCAL_KEYWORDS_BASE}rahta.ppn`,
  domus: `${PORCUPINE_LOCAL_KEYWORDS_BASE}domus.ppn`,
});
