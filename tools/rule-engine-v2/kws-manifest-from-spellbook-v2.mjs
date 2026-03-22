// Back-compat re-export shim for legacy spellbook-named KWS manifest module path.
export {
  KWS_MANIFEST_REL_PATH,
  KWS_MODEL_REL_ROOT,
  buildKwsManifestFromWordbookV2,
  buildKwsManifestFromSpellbookV2,
  normalizeKwsManifest,
} from "./kws-manifest-from-wordbook-v2.mjs";
