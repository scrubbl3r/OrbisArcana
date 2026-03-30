// Canonical script-path registry for orchestration/check-runner utilities.
// Keeps script path references centralized to avoid string drift across tools.
// Paths are repo-relative and resolved by callers at execution time.
export const RULE_ENGINE_V2_SCRIPT_PATHS = Object.freeze({
  preSmokeCheck: "tools/rule-engine-v2/pre-smoke-check.mjs",
  readyCheck: "tools/rule-engine-v2/ready-check.mjs",
  milestoneTrend: "tools/rule-engine-v2/milestone-trend-v2.mjs",
  writeEffectiveSnapshot: "tools/rule-engine-v2/write-effective-snapshot.mjs",
  writeMasterControlDoc: "tools/rule-engine-v2/write-master-control-doc-v2.mjs",
});
