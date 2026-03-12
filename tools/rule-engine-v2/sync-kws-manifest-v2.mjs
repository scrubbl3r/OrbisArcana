import { resolve } from "node:path";
import {
  KWS_MANIFEST_REL_PATH,
  buildKwsManifestFromSpellbookV2,
  normalizeKwsManifest,
} from "./kws-manifest-from-spellbook-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";

const manifestPath = resolve(process.cwd(), KWS_MANIFEST_REL_PATH);
const nextManifest = normalizeKwsManifest(buildKwsManifestFromSpellbookV2());

let prev = null;
const prevRaw = readJsonSafe(manifestPath);
prev = prevRaw ? normalizeKwsManifest(prevRaw) : null;

writeJsonFile(manifestPath, nextManifest);
const changed = JSON.stringify(prev) !== JSON.stringify(nextManifest);
console.log(`[sync:kws-manifest:v2] wrote ${manifestPath}`);
console.log(`[sync:kws-manifest:v2] models: ${nextManifest.models.length}`);
console.log(`[sync:kws-manifest:v2] changed: ${changed ? "yes" : "no"}`);
