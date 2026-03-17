import { spawnSync } from "node:child_process";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { runCheckScriptOrFailStatus } from "./run-check-fail-status-v2.mjs";
import { RULE_ENGINE_V2_SCRIPT_PATHS } from "./script-paths-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { appendJsonLine } from "./write-jsonl-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { toTrimmedText } from "./value-utils-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";

const CHECK_TAG = "milestone:v2";
const logMilestone = createTaggedLogger(CHECK_TAG);
const MILESTONE_STEP_LABELS = Object.freeze({
  ready: "ready:v2",
  smokeBatch: "smoke:batch:v2",
});
const MILESTONE_MESSAGES = Object.freeze({
  trendGenerationFailed: "milestone trend generation failed",
  readyOrBatchFailed: "ready and/or smoke batch failed",
  pass: "PASS",
});
const MILESTONE_REPORT_LABELS = Object.freeze({
  wroteReport: "wrote report",
  refreshedWithTrend: "refreshed report with trend",
});
const MILESTONE_BATCH_SKIPPED_STATUS = -1;
const MILESTONE_DOC_PATHS = Object.freeze({
  health: resolveRuleEngineDocPath("health"),
  smoke: resolveRuleEngineDocPath("milestoneSmoke"),
  history: resolveRuleEngineDocPath("milestoneHistory"),
  trend: resolveRuleEngineDocPath("milestoneTrend"),
});

function runStep(label, scriptPath) {
  logMilestone(`running ${label}...`);
  return runCheckScript(scriptPath, { stdio: "inherit" });
}

function getGitRef() {
  const res = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  return res.status === 0 ? toTrimmedText(res.stdout) : "";
}

function asStepResult(result, extras = {}) {
  const status = Number(result?.status ?? 0);
  return {
    ok: result?.ok === true,
    status,
    ...extras,
  };
}

function writeMilestoneReport(path, report, label) {
  writeJsonFile(path, report);
  logMilestone(`${label}: ${path}`);
}

function appendMilestoneHistory(path, report) {
  appendJsonLine(path, report);
  logMilestone(`appended history: ${path}`);
}

const ready = runStep(MILESTONE_STEP_LABELS.ready, RULE_ENGINE_V2_SCRIPT_PATHS.readyCheck);
const readyOk = ready.ok === true;
const batch = readyOk
  ? runStep(MILESTONE_STEP_LABELS.smokeBatch, RULE_ENGINE_V2_SCRIPT_PATHS.smokeBatch)
  : { ok: false, status: MILESTONE_BATCH_SKIPPED_STATUS };
const batchOk = batch.ok === true;

const report = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.milestone,
  generatedAt: nowIso(),
  gitRef: getGitRef(),
  steps: {
    ready: asStepResult(ready),
    batch: asStepResult(batch, { skipped: !readyOk }),
  },
  health: readJsonSafe(MILESTONE_DOC_PATHS.health),
  pass: readyOk && batchOk,
};

writeMilestoneReport(MILESTONE_DOC_PATHS.smoke, report, MILESTONE_REPORT_LABELS.wroteReport);

appendMilestoneHistory(MILESTONE_DOC_PATHS.history, report);

runCheckScriptOrFailStatus({
  tag: CHECK_TAG,
  message: MILESTONE_MESSAGES.trendGenerationFailed,
  script: RULE_ENGINE_V2_SCRIPT_PATHS.milestoneTrend,
});
report.trend = readJsonSafe(MILESTONE_DOC_PATHS.trend);
writeMilestoneReport(MILESTONE_DOC_PATHS.smoke, report, MILESTONE_REPORT_LABELS.refreshedWithTrend);

if (!report.pass) {
  failCheck(CHECK_TAG, MILESTONE_MESSAGES.readyOrBatchFailed);
}
logMilestone(MILESTONE_MESSAGES.pass);
