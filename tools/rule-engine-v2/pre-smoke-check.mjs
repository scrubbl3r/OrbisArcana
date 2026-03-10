import { spawnSync } from "node:child_process";
import {
  SPELLBOOK_V2,
  INTERACTIONS_V2,
  validateSpellbookV2,
  validateInteractionsV2,
} from "../../src/content/interactions-v2/index.js";

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

const snapshotRun = spawnSync(
  process.execPath,
  ["tools/rule-engine-v2/write-effective-snapshot.mjs"],
  { stdio: "inherit" }
);
if (snapshotRun.status !== 0) {
  fail("effective snapshot generation failed");
}

console.log("[pre-smoke] OK: validators passed + effective snapshot refreshed");
