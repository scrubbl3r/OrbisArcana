import { SPELLBOOK_V2 } from "../../src/content/interactions-v2/index.js";
import { listSpellbookSpells } from "./spellbook-v2-utils.mjs";
import { asLowerText, asTrimText } from "./text-utils-v2.mjs";

export const KWS_MANIFEST_REL_PATH = "tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json";
export const KWS_MODEL_REL_ROOT = "../../../assets/kws/openwakeword-models";

export function buildKwsManifestFromSpellbookV2(spellbook = SPELLBOOK_V2) {
  const spells = listSpellbookSpells(spellbook);
  const models = [];
  for (const spell of spells) {
    if (!spell || spell.active === false) continue;
    const id = asLowerText(spell.id);
    const phrase = asLowerText(spell.phrase) || id;
    const onnx = asLowerText(spell.onnx);
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
