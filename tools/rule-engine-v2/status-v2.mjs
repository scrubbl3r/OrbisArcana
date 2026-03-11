import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";

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
  return runCheckScript(scriptPath, { stdio: "ignore" }).ok;
}

const health = safeReadJson(resolve(process.cwd(), "docs/rule-engine-v2.health.json")) || {};
const trend = safeReadJson(resolve(process.cwd(), "docs/rule-engine-v2.milestone-trend.json")) || {};
const manifestChecks = Object.freeze({
  readyPhasesManifest: runCheck("tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs"),
  contractManifest: runCheck("tools/rule-engine-v2/check-contract-manifest-v2.mjs"),
  regressionManifest: runCheck("tools/rule-engine-v2/check-regression-manifest-v2.mjs"),
});
const readyPhaseChecks = Object.freeze(Object.fromEntries(
  READY_PHASES_V2.map((phase) => [phase.id, runCheck(phase.script)])
));
const readyPhasesOk = READY_PHASES_V2.every((phase) => readyPhaseChecks[phase.id] === true);
const readyPhaseStatusList = READY_PHASES_V2
  .map((phase) => `${phase.id}:${yn(readyPhaseChecks[phase.id] === true)}`)
  .join(" ");
const contractChecks = Object.freeze(Object.fromEntries(
  CONTRACT_CHECKS_V2.map((check) => [check.id, runCheck(check.script)])
));
const contractsOk = CONTRACT_CHECKS_V2.every((check) => contractChecks[check.id] === true);
const contractStatusList = CONTRACT_CHECKS_V2
  .map((check) => `${check.id}:${yn(contractChecks[check.id] === true)}`)
  .join(" ");
const regressionChecks = Object.freeze(Object.fromEntries(
  REGRESSION_CHECKS_V2.map((check) => [check.id, runCheck(check.script)])
));
const regressionsOk = REGRESSION_CHECKS_V2.every((check) => regressionChecks[check.id] === true);
const regressionStatusList = REGRESSION_CHECKS_V2
  .map((check) => `${check.id}:${yn(regressionChecks[check.id] === true)}`)
  .join(" ");

const lines = [
  "[status:v2] ---",
  `[status:v2] spellbook ok: ${yn(health.spellbookOk === true)}`,
  `[status:v2] interactions ok: ${yn(health.interactionsOk === true)}`,
  `[status:v2] bootstrap uses v2: ${yn(health.bootstrapUsesV2Adapter === true)}`,
  `[status:v2] rules projection only: ${yn(health.projectionRulesOnly === true)}`,
  `[status:v2] rules (interactions/projection): ${Number(health.interactionsRuleCount || 0)}/${Number(health.projectedRuleCount || 0)}`,
  `[status:v2] drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `[status:v2] manifests (ready/contract/regression): ${yn(manifestChecks.readyPhasesManifest)}/${yn(manifestChecks.contractManifest)}/${yn(manifestChecks.regressionManifest)}`,
  `[status:v2] ready phases ok: ${yn(readyPhasesOk)}`,
  `[status:v2] ready phases: ${readyPhaseStatusList}`,
  `[status:v2] regressions ok: ${yn(regressionsOk)}`,
  `[status:v2] regressions: ${regressionStatusList}`,
  `[status:v2] contracts ok: ${yn(contractsOk)}`,
  `[status:v2] contracts: ${contractStatusList}`,
  `[status:v2] milestone runs: ${Number(trend.totalRuns || 0)}`,
  `[status:v2] pass rate all/recent: ${Number(trend.passRateAllPct || 0)}% / ${Number(trend.passRateRecentPct || 0)}%`,
  `[status:v2] latest milestone: ${trend.latestPass === true ? "PASS" : "FAIL"} ${String(trend.latestGitRef || "").trim()}`,
  "[status:v2] ---",
];

for (const line of lines) console.log(line);
