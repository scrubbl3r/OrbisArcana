import { spawnSync } from "node:child_process";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { RULE_ENGINE_V2_SCRIPT_PATHS } from "./script-paths-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { appendJsonLine } from "./write-jsonl-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { toTrimmedText } from "./value-utils-v2.mjs";

function runStep(label, scriptPath) {
  console.log(`[milestone:v2] running ${label}...`);
  return runCheckScript(scriptPath, { stdio: "inherit" });
}

function getGitRef() {
  const res = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  return res.status === 0 ? toTrimmedText(res.stdout || "") : "";
}

const ready = runStep("ready:v2", RULE_ENGINE_V2_SCRIPT_PATHS.readyCheck);
const batch = ready.ok
  ? runStep("smoke:batch:v2", RULE_ENGINE_V2_SCRIPT_PATHS.smokeBatch)
  : { ok: false, status: -1 };

const report = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.milestone,
  generatedAt: nowIso(),
  gitRef: getGitRef(),
  steps: {
    ready: {
      ok: ready.ok,
      status: ready.status,
    },
    batch: {
      ok: batch.ok,
      status: batch.status,
      skipped: !ready.ok,
    },
  },
  health: readJsonSafe(resolveRuleEngineDocPath("health")),
  pass: ready.ok && batch.ok,
};

const outPath = resolveRuleEngineDocPath("milestoneSmoke");
writeJsonFile(outPath, report);
console.log(`[milestone:v2] wrote report: ${outPath}`);

const historyPath = resolveRuleEngineDocPath("milestoneHistory");
appendJsonLine(historyPath, report);
console.log(`[milestone:v2] appended history: ${historyPath}`);

const trendRun = runCheckScript(RULE_ENGINE_V2_SCRIPT_PATHS.milestoneTrend, { stdio: "inherit" });
if (!trendRun.ok) {
  console.error("[milestone:v2] FAIL: milestone trend generation failed");
  process.exit(trendRun.status || 1);
}
const trendPath = resolveRuleEngineDocPath("milestoneTrend");
report.trend = readJsonSafe(trendPath);
writeJsonFile(outPath, report);
console.log(`[milestone:v2] refreshed report with trend: ${outPath}`);

if (!report.pass) {
  console.error("[milestone:v2] FAIL");
  process.exit(1);
}
console.log("[milestone:v2] PASS");
