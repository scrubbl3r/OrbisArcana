import { WORDBOOK_V2 } from "../../src/content/interactions-v2/index.js";
import { listWordbookWords } from "./wordbook-v2-utils.mjs";
import { asLowerText, asTrimText } from "./text-utils-v2.mjs";

export const KWS_MANIFEST_REL_PATH = "tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json";
export const KWS_MODEL_REL_ROOT = "../../../assets/kws/openwakeword-models";

export function buildKwsManifestFromWordbookV2(wordbook = WORDBOOK_V2) {
  const words = listWordbookWords(wordbook);
  const models = [];
  for (const word of words) {
    if (!word || word.active === false) continue;
    const id = asLowerText(word.id);
    const phrase = asLowerText(word.phrase) || id;
    const onnx = asLowerText(word.onnx);
    if (!id || !phrase || !onnx) continue;
    models.push({
      path: `${KWS_MODEL_REL_ROOT}/${onnx}.onnx`,
      label: phrase,
      token: phrase,
    });
  }
  return { models };
}

export function normalizeKwsManifest(input) {
  const models = Array.isArray(input?.models) ? input.models : [];
  return {
    models: models.map((m) => ({
      path: asTrimText(m?.path),
      label: asLowerText(m?.label),
      token: asLowerText(m?.token),
    })),
  };
}

// Backward-compatible alias exports.
export const buildKwsManifestFromSpellbookV2 = buildKwsManifestFromWordbookV2;
