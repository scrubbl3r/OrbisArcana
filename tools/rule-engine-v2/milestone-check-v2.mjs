import { appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";

function runStep(label, scriptPath) {
  console.log(`[milestone:v2] running ${label}...`);
  return runCheckScript(scriptPath, { stdio: "inherit" });
}

function getGitRef() {
  const res = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  return res.status === 0 ? String(res.stdout || "").trim() : "";
}

const ready = runStep("ready:v2", "tools/rule-engine-v2/ready-check.mjs");
const batch = ready.ok
  ? runStep("smoke:batch:v2", "tools/rule-engine-v2/smoke-batch-v2.mjs")
  : { ok: false, status: -1 };

const report = {
  schema: "orbis.rule_engine_v2.milestone",
  generatedAt: new Date().toISOString(),
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
appendFileSync(historyPath, JSON.stringify(report) + "\n", "utf8");
console.log(`[milestone:v2] appended history: ${historyPath}`);

const trendRun = runCheckScript("tools/rule-engine-v2/milestone-trend-v2.mjs", { stdio: "inherit" });
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
