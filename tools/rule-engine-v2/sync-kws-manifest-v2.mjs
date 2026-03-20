import { resolve } from "node:path";
import {
  KWS_MANIFEST_REL_PATH,
  buildKwsManifestFromWordbookV2,
  normalizeKwsManifest,
} from "./kws-manifest-from-wordbook-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";

const CHECK_TAG = "sync:kws-manifest:v2";
const logSync = createTaggedLogger(CHECK_TAG);

const manifestPath = resolve(process.cwd(), KWS_MANIFEST_REL_PATH);
const nextManifest = normalizeKwsManifest(buildKwsManifestFromWordbookV2());

let prev = null;
const prevRaw = readJsonSafe(manifestPath);
prev = prevRaw ? normalizeKwsManifest(prevRaw) : null;

writeJsonFile(manifestPath, nextManifest);
const changed = JSON.stringify(prev) !== JSON.stringify(nextManifest);
logSync(`wrote ${manifestPath}`);
logSync(`models: ${nextManifest.models.length}`);
logSync(`changed: ${changed ? "yes" : "no"}`);
