import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { readJsonLines } from "./read-jsonl-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";

const CHECK_TAG = "milestone:trend:v2";

function pct(part, total) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function summarize(history, lookback = 10) {
  const all = Array.isArray(history) ? history : [];
  const recent = all.slice(-Math.max(1, lookback));
  const passAll = all.filter((r) => isTrue(r && r.pass)).length;
  const passRecent = recent.filter((r) => isTrue(r && r.pass)).length;
  const latest = all.length ? all[all.length - 1] : null;
  return {
    totalRuns: all.length,
    recentWindow: recent.length,
    passRateAllPct: pct(passAll, all.length),
    passRateRecentPct: pct(passRecent, recent.length),
    latestPass: isTrue(latest && latest.pass),
    latestGeneratedAt: latest ? String(latest.generatedAt || "") : "",
    latestGitRef: latest ? String(latest.gitRef || "") : "",
  };
}

const historyPath = resolveRuleEngineDocPath("milestoneHistory");
const summaryPath = resolveRuleEngineDocPath("milestoneTrend");
const history = readJsonLines(historyPath);
const summary = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.milestoneTrend,
  generatedAt: nowIso(),
  historyPath,
  ...summarize(history, 10),
};

console.log(`[${CHECK_TAG}] total runs: ${summary.totalRuns}`);
console.log(`[${CHECK_TAG}] pass rate (all): ${summary.passRateAllPct}%`);
console.log(`[${CHECK_TAG}] pass rate (recent ${summary.recentWindow}): ${summary.passRateRecentPct}%`);
console.log(`[${CHECK_TAG}] latest: ${summary.latestPass ? "PASS" : "FAIL"} ${summary.latestGitRef || ""}`);
writeJsonFile(summaryPath, summary);
console.log(`[${CHECK_TAG}] wrote summary: ${summaryPath}`);
