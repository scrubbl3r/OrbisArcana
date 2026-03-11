import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import {
  RULE_ENGINE_MASTER_CONTROL,
} from "../../src/content/spell-rules/index.js";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  buildRuleEngineFromInteractionsV2,
  validateSpellbookV2,
  validateInteractionsV2,
  buildRulesFromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
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
const projectedRules = buildRulesFromInteractionsV2(INTERACTIONS_V2);
const projectedById = new Map((Array.isArray(projectedRules) ? projectedRules : []).map((r) => [String(r && r.id || ""), r]));
const runtimeProjected = buildRuleEngineFromInteractionsV2({
  interactionsV2: INTERACTIONS_V2,
  baseRuleEngine: {
    ...(RULE_ENGINE_MASTER_CONTROL && typeof RULE_ENGINE_MASTER_CONTROL === "object"
      ? RULE_ENGINE_MASTER_CONTROL
      : {}),
    rules: [],
  },
});
const runtimeRules = Array.isArray(runtimeProjected?.rules) ? runtimeProjected.rules : [];
const runtimeById = new Map(runtimeRules.map((r) => [String(r && r.id || ""), r]));
const allIds = new Set([...projectedById.keys(), ...runtimeById.keys()].filter(Boolean));
const driftIds = [];
for (const id of allIds) {
  const a = JSON.stringify(projectedById.get(id) || null);
  const b = JSON.stringify(runtimeById.get(id) || null);
  if (a !== b) driftIds.push(id);
}
if (driftIds.length) {
  fail("projected runtime rules drift from direct V2 projection", driftIds.map((id) => `drift rule id: ${id}`));
}

const snapshotRun = spawnSync(
  process.execPath,
  ["tools/rule-engine-v2/write-effective-snapshot.mjs"],
  { stdio: "inherit" }
);
if (snapshotRun.status !== 0) {
  fail("effective snapshot generation failed");
}

const masterDocRun = spawnSync(
  process.execPath,
  ["tools/rule-engine-v2/write-master-control-doc-v2.mjs"],
  { stdio: "inherit" }
);
if (masterDocRun.status !== 0) {
  fail("master control doc generation failed");
}

console.log("[pre-smoke] OK: validators passed + effective snapshot refreshed");
