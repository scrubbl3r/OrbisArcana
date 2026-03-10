import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (_) {
    return "";
  }
}

function parseHistory(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

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

const historyPath = resolve(process.cwd(), "docs/rule-engine-v2.milestone-history.jsonl");
const summaryPath = resolve(process.cwd(), "docs/rule-engine-v2.milestone-trend.json");
const history = parseHistory(safeRead(historyPath));
const summary = {
  schema: "orbis.rule_engine_v2.milestone_trend",
  generatedAt: new Date().toISOString(),
  historyPath,
  ...summarize(history, 10),
};

console.log(`[milestone:trend:v2] total runs: ${summary.totalRuns}`);
console.log(`[milestone:trend:v2] pass rate (all): ${summary.passRateAllPct}%`);
console.log(`[milestone:trend:v2] pass rate (recent ${summary.recentWindow}): ${summary.passRateRecentPct}%`);
console.log(`[milestone:trend:v2] latest: ${summary.latestPass ? "PASS" : "FAIL"} ${summary.latestGitRef || ""}`);
writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(`[milestone:trend:v2] wrote summary: ${summaryPath}`);
