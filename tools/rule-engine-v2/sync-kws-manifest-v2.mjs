import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  KWS_MANIFEST_REL_PATH,
  buildKwsManifestFromSpellbookV2,
  normalizeKwsManifest,
} from "./kws-manifest-from-spellbook-v2.mjs";

const manifestPath = resolve(process.cwd(), KWS_MANIFEST_REL_PATH);
const nextManifest = normalizeKwsManifest(buildKwsManifestFromSpellbookV2());

let prev = null;
try {
  prev = normalizeKwsManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
} catch (_) {
  prev = null;
}

writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2) + "\n", "utf8");
const changed = JSON.stringify(prev) !== JSON.stringify(nextManifest);
console.log(`[sync:kws-manifest:v2] wrote ${manifestPath}`);
console.log(`[sync:kws-manifest:v2] models: ${nextManifest.models.length}`);
console.log(`[sync:kws-manifest:v2] changed: ${changed ? "yes" : "no"}`);
