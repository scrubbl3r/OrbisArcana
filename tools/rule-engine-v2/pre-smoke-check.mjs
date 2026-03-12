import { existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  validateSpellbookV2,
  validateInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import {
  KWS_MANIFEST_REL_PATH,
  buildKwsManifestFromSpellbookV2,
  normalizeKwsManifest,
} from "./kws-manifest-from-spellbook-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { RULE_ENGINE_V2_SCRIPT_PATHS } from "./script-paths-v2.mjs";
import { failCheckWithDetails } from "./check-fail-v2.mjs";
import { readJsonCore } from "./read-json-core-v2.mjs";
import { computeProjectionDrift } from "./rules-projection-drift-v2.mjs";
import { listActiveSpellModelRefs } from "./spellbook-v2-utils.mjs";

const FAIL_TAG = "pre-smoke";
const fail = (message, details = []) => failCheckWithDetails(FAIL_TAG, message, details);

function loadJson(path) {
  const result = readJsonCore(path);
  if (!result.ok) {
    fail("json load failed", [`${path}: ${result.error}`]);
  }
  return result.value;
}

function verifyKwsManifestCoverage() {
  const manifestAbs = resolve(process.cwd(), KWS_MANIFEST_REL_PATH);
  const manifestRaw = loadJson(manifestAbs);
  const manifest = normalizeKwsManifest(manifestRaw);
  const expectedManifest = normalizeKwsManifest(buildKwsManifestFromSpellbookV2(SPELLBOOK_V2));
  if (JSON.stringify(manifest) !== JSON.stringify(expectedManifest)) {
    fail("kws manifest drift: regenerate from spellbook-v2", [
      `manifest: ${KWS_MANIFEST_REL_PATH}`,
      "run: npm run sync:kws-manifest:v2",
    ]);
  }
  const models = Array.isArray(manifest.models) ? manifest.models : [];
  const modelBaseByName = Object.create(null);
  const missingFiles = [];
  for (const entry of models) {
    const modelPath = String(entry && (entry.path || entry.url) || "").trim();
    if (!modelPath) continue;
    const absPath = resolve(dirname(manifestAbs), modelPath);
    const base = basename(absPath).toLowerCase();
    modelBaseByName[base] = absPath;
    if (!existsSync(absPath)) {
      missingFiles.push(`manifest model missing file: ${base} -> ${absPath}`);
      continue;
    }
    const dataPath = `${absPath}.data`;
    if (!existsSync(dataPath)) {
      missingFiles.push(`manifest model missing data pair: ${base} -> ${dataPath}`);
    }
  }
  if (missingFiles.length) {
    fail("kws manifest model files invalid", missingFiles);
  }

  const activeSpells = listActiveSpellModelRefs(SPELLBOOK_V2);
  const coverageErrors = [];
  for (const spell of activeSpells) {
    if (!spell.id || !spell.onnx) continue;
    const expectedBase = `${spell.onnx}.onnx`;
    if (!modelBaseByName[expectedBase]) {
      coverageErrors.push(`active spell missing manifest model: spell=${spell.id} expected=${expectedBase}`);
    }
  }
  if (coverageErrors.length) {
    fail("kws manifest does not cover active spellbook", coverageErrors);
  }
}

const spellbookErrors = validateSpellbookV2(SPELLBOOK_V2);
if (spellbookErrors.length) {
  fail("spellbook-v2 validation failed", spellbookErrors);
}

const interactionsResult = validateInteractionsV2(INTERACTIONS_V2);
if (!interactionsResult.ok) {
  fail("interactions-v2 validation failed", Array.isArray(interactionsResult.errors) ? interactionsResult.errors : []);
}

verifyKwsManifestCoverage();

if (!INTERACTIONS_V2_BOOTSTRAP || INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap !== true) {
  fail("runtime cutover guard failed", [
    "INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap must be true",
  ]);
}
const drift = computeProjectionDrift(INTERACTIONS_V2);
const driftIds = Array.isArray(drift?.driftIds) ? drift.driftIds : [];
if (driftIds.length) {
  fail("projected runtime rules drift from direct V2 projection", driftIds.map((id) => `drift rule id: ${id}`));
}

const snapshotRun = runCheckScript(RULE_ENGINE_V2_SCRIPT_PATHS.writeEffectiveSnapshot, { stdio: "inherit" });
if (!snapshotRun.ok) {
  fail("effective snapshot generation failed");
}

const masterDocRun = runCheckScript(RULE_ENGINE_V2_SCRIPT_PATHS.writeMasterControlDoc, { stdio: "inherit" });
if (!masterDocRun.ok) {
  fail("master control doc generation failed");
}

console.log("[pre-smoke] OK: validators passed + effective snapshot refreshed");
