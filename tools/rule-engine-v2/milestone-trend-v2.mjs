import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonLines } from "./read-jsonl-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";

function pct(part, total) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function summarize(history, lookback = 10) {
  const all = Array.isArray(history) ? history : [];
  const recent = all.slice(-Math.max(1, lookback));
  const passAll = all.filter((r) => r && r.pass === true).length;
  const passRecent = recent.filter((r) => r && r.pass === true).length;
  const latest = all.length ? all[all.length - 1] : null;
  return {
    totalRuns: all.length,
    recentWindow: recent.length,
    passRateAllPct: pct(passAll, all.length),
    passRateRecentPct: pct(passRecent, recent.length),
    latestPass: !!(latest && latest.pass === true),
    latestGeneratedAt: latest ? String(latest.generatedAt || "") : "",
    latestGitRef: latest ? String(latest.gitRef || "") : "",
  };
}

const historyPath = resolveRuleEngineDocPath("milestoneHistory");
const summaryPath = resolveRuleEngineDocPath("milestoneTrend");
const history = readJsonLines(historyPath);
const summary = {
  schema: "orbis.rule_engine_v2.milestone_trend",
  generatedAt: nowIso(),
  historyPath,
  ...summarize(history, 10),
};

console.log(`[milestone:trend:v2] total runs: ${summary.totalRuns}`);
console.log(`[milestone:trend:v2] pass rate (all): ${summary.passRateAllPct}%`);
console.log(`[milestone:trend:v2] pass rate (recent ${summary.recentWindow}): ${summary.passRateRecentPct}%`);
console.log(`[milestone:trend:v2] latest: ${summary.latestPass ? "PASS" : "FAIL"} ${summary.latestGitRef || ""}`);
writeJsonFile(summaryPath, summary);
console.log(`[milestone:trend:v2] wrote summary: ${summaryPath}`);
