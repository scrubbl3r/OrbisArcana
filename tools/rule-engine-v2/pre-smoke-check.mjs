import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  validateSpellbookV2,
  validateInteractionsV2,
  buildRulesV1FromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import {
  SPELL_RULES_V1_STATIC,
  SPELL_RULES_V1_LEGACY_BRIDGE,
} from "../../src/content/spell-rules/spell-rules-v1.js";
import {
  KWS_MANIFEST_REL_PATH,
  buildKwsManifestFromSpellbookV2,
  normalizeKwsManifest,
} from "./kws-manifest-from-spellbook-v2.mjs";

function fail(message, details = []) {
  console.error(`[pre-smoke] FAIL: ${message}`);
  for (const line of details) console.error(`  - ${line}`);
  process.exit(1);
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail("json load failed", [`${path}: ${err && err.message ? err.message : String(err)}`]);
  }
  return null;
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

  const activeSpells = (Array.isArray(SPELLBOOK_V2 && SPELLBOOK_V2.spells) ? SPELLBOOK_V2.spells : [])
    .filter((s) => s && s.active !== false)
    .map((s) => ({
      id: String(s.id || "").trim().toLowerCase(),
      onnx: String(s.onnx || "").trim().toLowerCase(),
    }));
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
if (!SPELL_RULES_V1_LEGACY_BRIDGE || SPELL_RULES_V1_LEGACY_BRIDGE.useInteractionsV2Rules !== true) {
  fail("legacy bridge guard failed", [
    "SPELL_RULES_V1_LEGACY_BRIDGE.useInteractionsV2Rules must be true",
  ]);
}

const projectedRules = buildRulesV1FromInteractionsV2(INTERACTIONS_V2);
const projectedById = new Map((Array.isArray(projectedRules) ? projectedRules : []).map((r) => [String(r && r.id || ""), r]));
const legacyById = new Map((Array.isArray(SPELL_RULES_V1_STATIC) ? SPELL_RULES_V1_STATIC : []).map((r) => [String(r && r.id || ""), r]));
const allIds = new Set([...projectedById.keys(), ...legacyById.keys()].filter(Boolean));
const driftIds = [];
for (const id of allIds) {
  const a = JSON.stringify(projectedById.get(id) || null);
  const b = JSON.stringify(legacyById.get(id) || null);
  if (a !== b) driftIds.push(id);
}
if (SPELL_RULES_V1_LEGACY_BRIDGE && SPELL_RULES_V1_LEGACY_BRIDGE.useInteractionsV2Rules === true && driftIds.length) {
  fail("legacy bridge is enabled but V1 static rules drift from V2 projection", driftIds.map((id) => `drift rule id: ${id}`));
}

const snapshotRun = spawnSync(
  process.execPath,
  ["tools/rule-engine-v2/write-effective-snapshot.mjs"],
  { stdio: "inherit" }
);
if (snapshotRun.status !== 0) {
  fail("effective snapshot generation failed");
}

console.log("[pre-smoke] OK: validators passed + effective snapshot refreshed");
