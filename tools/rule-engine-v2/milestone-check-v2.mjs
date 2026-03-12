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
  return {
    ok: result?.ok === true,
    status: Number(result?.status || 0),
    ...extras,
  };
}

function writeMilestoneReport(path, report, label = "wrote report") {
  writeJsonFile(path, report);
  logMilestone(`${label}: ${path}`);
}

function appendMilestoneHistory(path, report) {
  appendJsonLine(path, report);
  logMilestone(`appended history: ${path}`);
}

const ready = runStep(MILESTONE_STEP_LABELS.ready, RULE_ENGINE_V2_SCRIPT_PATHS.readyCheck);
const batch = ready.ok
  ? runStep(MILESTONE_STEP_LABELS.smokeBatch, RULE_ENGINE_V2_SCRIPT_PATHS.smokeBatch)
  : { ok: false, status: -1 };

const report = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.milestone,
  generatedAt: nowIso(),
  gitRef: getGitRef(),
  steps: {
    ready: asStepResult(ready),
    batch: asStepResult(batch, { skipped: !ready.ok }),
  },
  health: readJsonSafe(MILESTONE_DOC_PATHS.health),
  pass: ready.ok && batch.ok,
};

const outPath = MILESTONE_DOC_PATHS.smoke;
writeMilestoneReport(outPath, report);

const historyPath = MILESTONE_DOC_PATHS.history;
appendMilestoneHistory(historyPath, report);

runCheckScriptOrFailStatus({
  tag: CHECK_TAG,
  message: MILESTONE_MESSAGES.trendGenerationFailed,
  script: RULE_ENGINE_V2_SCRIPT_PATHS.milestoneTrend,
});
const trendPath = MILESTONE_DOC_PATHS.trend;
report.trend = readJsonSafe(trendPath);
writeMilestoneReport(outPath, report, "refreshed report with trend");

if (!report.pass) {
  failCheck(CHECK_TAG, MILESTONE_MESSAGES.readyOrBatchFailed);
}
logMilestone(MILESTONE_MESSAGES.pass);
