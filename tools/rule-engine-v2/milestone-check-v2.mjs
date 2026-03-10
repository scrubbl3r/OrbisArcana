import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function runStep(label, scriptPath) {
  console.log(`[milestone:v2] running ${label}...`);
  const res = spawnSync(process.execPath, [scriptPath], { stdio: "inherit" });
  return { ok: res.status === 0, status: Number(res.status || 0) };
}

function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (_) {
    return null;
  }
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
  health: safeReadJson(resolve(process.cwd(), "docs/rule-engine-v2.health.json")),
  pass: ready.ok && batch.ok,
};

const outPath = resolve(process.cwd(), "docs/rule-engine-v2.milestone-smoke.json");
writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(`[milestone:v2] wrote report: ${outPath}`);

if (!report.pass) {
  console.error("[milestone:v2] FAIL");
  process.exit(1);
}
console.log("[milestone:v2] PASS");
