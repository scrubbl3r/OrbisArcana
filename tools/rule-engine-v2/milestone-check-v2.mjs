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
import { failCheck, failCheckStatus } from "./check-fail-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";

const CHECK_TAG = "milestone:v2";
const logMilestone = createTaggedLogger(CHECK_TAG);

function runStep(label, scriptPath) {
  logMilestone(`running ${label}...`);
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
logMilestone(`wrote report: ${outPath}`);

const historyPath = resolveRuleEngineDocPath("milestoneHistory");
appendJsonLine(historyPath, report);
logMilestone(`appended history: ${historyPath}`);

const trendRun = runCheckScript(RULE_ENGINE_V2_SCRIPT_PATHS.milestoneTrend, { stdio: "inherit" });
if (!trendRun.ok) {
  failCheckStatus(CHECK_TAG, "milestone trend generation failed", trendRun.status || 1);
}
const trendPath = resolveRuleEngineDocPath("milestoneTrend");
report.trend = readJsonSafe(trendPath);
writeJsonFile(outPath, report);
logMilestone(`refreshed report with trend: ${outPath}`);

if (!report.pass) {
  failCheck(CHECK_TAG, "ready and/or smoke batch failed");
}
logMilestone("PASS");
