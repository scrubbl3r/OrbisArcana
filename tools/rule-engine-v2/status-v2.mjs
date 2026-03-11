import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (_) {
    return null;
  }
}

function yn(v) {
  return v ? "yes" : "no";
}

function runCheck(scriptPath) {
  const res = spawnSync(process.execPath, [scriptPath], { stdio: "ignore" });
  return res.status === 0;
}

const health = safeReadJson(resolve(process.cwd(), "docs/rule-engine-v2.health.json")) || {};
const trend = safeReadJson(resolve(process.cwd(), "docs/rule-engine-v2.milestone-trend.json")) || {};
const contractChecks = Object.freeze({
  ruleSource: runCheck("tools/rule-engine-v2/check-rule-source-contract-v2.mjs"),
  policyAlias: runCheck("tools/rule-engine-v2/check-policy-control-contract-v2.mjs"),
  runtimePolicyImport: runCheck("tools/rule-engine-v2/check-runtime-policy-import-contract-v2.mjs"),
  docPolicy: runCheck("tools/rule-engine-v2/check-doc-policy-terminology-v2.mjs"),
  validatorPolicy: runCheck("tools/rule-engine-v2/check-validator-policy-terminology-v2.mjs"),
  compatSurface: runCheck("tools/rule-engine-v2/check-master-control-compat-surface-v2.mjs"),
  importBoundary: runCheck("tools/rule-engine-v2/check-master-control-import-boundary-v2.mjs"),
});
const contractsOk = Object.values(contractChecks).every(Boolean);

const lines = [
  "[status:v2] ---",
  `[status:v2] spellbook ok: ${yn(health.spellbookOk === true)}`,
  `[status:v2] interactions ok: ${yn(health.interactionsOk === true)}`,
  `[status:v2] bootstrap uses v2: ${yn(health.bootstrapUsesV2Adapter === true)}`,
  `[status:v2] rules projection only: ${yn(health.projectionRulesOnly === true)}`,
  `[status:v2] rules (interactions/projection): ${Number(health.interactionsRuleCount || 0)}/${Number(health.projectedRuleCount || 0)}`,
  `[status:v2] drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `[status:v2] contracts ok: ${yn(contractsOk)}`,
  `[status:v2] contracts (rule_source/policy_alias/runtime_import/doc_policy/validator_policy/compat_surface/import_boundary): ${yn(contractChecks.ruleSource)}/${yn(contractChecks.policyAlias)}/${yn(contractChecks.runtimePolicyImport)}/${yn(contractChecks.docPolicy)}/${yn(contractChecks.validatorPolicy)}/${yn(contractChecks.compatSurface)}/${yn(contractChecks.importBoundary)}`,
  `[status:v2] milestone runs: ${Number(trend.totalRuns || 0)}`,
  `[status:v2] pass rate all/recent: ${Number(trend.passRateAllPct || 0)}% / ${Number(trend.passRateRecentPct || 0)}%`,
  `[status:v2] latest milestone: ${trend.latestPass === true ? "PASS" : "FAIL"} ${String(trend.latestGitRef || "").trim()}`,
  "[status:v2] ---",
];

for (const line of lines) console.log(line);
