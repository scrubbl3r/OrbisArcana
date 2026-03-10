import { spawnSync } from "node:child_process";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  validateSpellbookV2,
  validateInteractionsV2,
  buildRulesV1FromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import {
  SPELL_RULES_V1_STATIC,
  SPELL_RULES_V1_LEGACY_BRIDGE,
} from "../../src/content/spell-rules/spell-rules-v1.js";

function fail(message, details = []) {
  console.error(`[pre-smoke] FAIL: ${message}`);
  for (const line of details) console.error(`  - ${line}`);
  process.exit(1);
}

const spellbookErrors = validateSpellbookV2(SPELLBOOK_V2);
if (spellbookErrors.length) {
  fail("spellbook-v2 validation failed", spellbookErrors);
}

const interactionsResult = validateInteractionsV2(INTERACTIONS_V2);
if (!interactionsResult.ok) {
  fail("interactions-v2 validation failed", Array.isArray(interactionsResult.errors) ? interactionsResult.errors : []);
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
