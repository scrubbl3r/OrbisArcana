import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CHECK_MANIFEST_SETS_V2,
  CHECK_MANIFEST_VALIDATORS_V2,
} from "./check-manifests-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";

function yn(v) {
  return v ? "yes" : "no";
}

function runCheck(scriptPath) {
  return runCheckScript(scriptPath, { stdio: "ignore" }).ok;
}

const health = readJsonSafe(resolve(process.cwd(), "docs/rule-engine-v2.health.json")) || {};
const trend = readJsonSafe(resolve(process.cwd(), "docs/rule-engine-v2.milestone-trend.json")) || {};
const CHECK_SETS_BY_NAME = Object.freeze(
  Object.fromEntries(CHECK_MANIFEST_SETS_V2.map((set) => [set.name, set.entries]))
);
const READY_PHASES_V2 = CHECK_SETS_BY_NAME.ready || [];
const REGRESSION_CHECKS_V2 = CHECK_SETS_BY_NAME.regression || [];
const CONTRACT_CHECKS_V2 = CHECK_SETS_BY_NAME.contract || [];
const manifestChecks = Object.freeze({
  readyPhasesManifest: runCheck(CHECK_MANIFEST_VALIDATORS_V2.ready),
  contractManifest: runCheck(CHECK_MANIFEST_VALIDATORS_V2.contract),
  regressionManifest: runCheck(CHECK_MANIFEST_VALIDATORS_V2.regression),
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

const statusArtifact = {
  schema: "orbis.rule_engine_v2.status",
  generatedAt: new Date().toISOString(),
  health: {
    spellbookOk: health.spellbookOk === true,
    interactionsOk: health.interactionsOk === true,
    bootstrapUsesV2Adapter: health.bootstrapUsesV2Adapter === true,
    projectionRulesOnly: health.projectionRulesOnly === true,
    interactionsRuleCount: Number(health.interactionsRuleCount || 0),
    projectedRuleCount: Number(health.projectedRuleCount || 0),
    driftRuleIds: Array.isArray(health.driftRuleIds) ? health.driftRuleIds.slice() : [],
  },
  manifests: {
    ready: manifestChecks.readyPhasesManifest === true,
    contract: manifestChecks.contractManifest === true,
    regression: manifestChecks.regressionManifest === true,
  },
  readyPhases: Object.fromEntries(
    READY_PHASES_V2.map((phase) => [phase.id, readyPhaseChecks[phase.id] === true])
  ),
  regressions: Object.fromEntries(
    REGRESSION_CHECKS_V2.map((check) => [check.id, regressionChecks[check.id] === true])
  ),
  contracts: Object.fromEntries(
    CONTRACT_CHECKS_V2.map((check) => [check.id, contractChecks[check.id] === true])
  ),
  summary: {
    readyPhasesOk,
    regressionsOk,
    contractsOk,
  },
  trend: {
    totalRuns: Number(trend.totalRuns || 0),
    passRateAllPct: Number(trend.passRateAllPct || 0),
    passRateRecentPct: Number(trend.passRateRecentPct || 0),
    latestPass: trend.latestPass === true,
    latestGitRef: String(trend.latestGitRef || "").trim(),
  },
};

const statusPath = resolve(process.cwd(), "docs/rule-engine-v2.status.json");
writeFileSync(statusPath, JSON.stringify(statusArtifact, null, 2) + "\n", "utf8");
console.log(`[status:v2] wrote status: ${statusPath}`);
