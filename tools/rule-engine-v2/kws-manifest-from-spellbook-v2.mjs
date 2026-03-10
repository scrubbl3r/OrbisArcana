import { SPELLBOOK_V2 } from "../../src/content/interactions-v2/index.js";

export const KWS_MANIFEST_REL_PATH = "tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json";
export const KWS_MODEL_REL_ROOT = "../../../assets/kws/openwakeword-models";

function asText(v) {
  return String(v == null ? "" : v).trim().toLowerCase();
}

export function buildKwsManifestFromSpellbookV2(spellbook = SPELLBOOK_V2) {
  const spells = Array.isArray(spellbook && spellbook.spells) ? spellbook.spells : [];
  const models = [];
  for (const spell of spells) {
    if (!spell || spell.active === false) continue;
    const id = asText(spell.id);
    const phrase = asText(spell.phrase) || id;
    const onnx = asText(spell.onnx);
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
  const models = Array.isArray(input && input.models) ? input.models : [];
  return {
    models: models.map((m) => ({
      path: String(m && m.path || "").trim(),
      label: String(m && m.label || "").trim().toLowerCase(),
      token: String(m && m.token || "").trim().toLowerCase(),
    })),
  };
}
