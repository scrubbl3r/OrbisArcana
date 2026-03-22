import { ACTIVE_WORDS_BY_ID } from "../wordbook.js";
import {
  KWS_INFER_DEFAULT_WORD_ID,
  KWS_SIM_WORD_IDS,
} from "../../content/interactions-v2/orchestrator-v1-kws-profile.js";

function resolveActivePhraseById(id, fallback = "") {
  const word = ACTIVE_WORDS_BY_ID[String(id || "").trim().toLowerCase()];
  return String((word && (word.phrase || word.id)) || fallback || "").trim().toLowerCase();
}

export const OPENWAKEWORD_BROWSER_SIM_TOKENS = Object.freeze(
  (Array.isArray(KWS_SIM_WORD_IDS) ? KWS_SIM_WORD_IDS : [])
    .map((id) => resolveActivePhraseById(id, String(id || "").trim().toLowerCase()))
    .filter(Boolean)
);

const DEFAULT_INFER_TOKEN = resolveActivePhraseById(KWS_INFER_DEFAULT_WORD_ID, "pyro");

export const OPENWAKEWORD_BROWSER_CONFIG_DEFAULT = Object.freeze({
  enabled: true,
  label: "openwakeword-browser",
  simulate: false,
  simulationIntervalMs: 1400,
  manifestUrl: "./tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json",
  melModelUrl: "./assets/kws/openwakeword-base-models/melspectrogram.onnx",
  embeddingModelUrl: "./assets/kws/openwakeword-base-models/embedding_model.onnx",
  requireOnnxDataPair: true,
  ortModuleUrl: "./vendor/onnxruntime/1.22.0/ort.wasm.min.mjs",
  ortWasmRootUrl: "./vendor/onnxruntime/1.22.0/",
  inferToken: DEFAULT_INFER_TOKEN || "pyro",
  inferThreshold: 0.15,
  inferCooldownMs: 600,
  inferPollMs: 33,
  tokenMap: Object.freeze({}),
});
