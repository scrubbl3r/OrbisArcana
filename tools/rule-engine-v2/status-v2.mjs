import { resolve } from "node:path";
import {
  CHECK_MANIFEST_SETS_BY_NAME_V2,
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  CHECK_MANIFEST_VALIDATORS_V2,
} from "./check-manifests-v2.mjs";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { formatCheckStatusList } from "./status-format-v2.mjs";
import {
  buildCheckBooleanMap,
  buildCheckResults,
  buildBooleanMapFromOrder,
  buildManifestValidatorChecks,
  formatOrderedBooleanSummary,
} from "./status-checks-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";

function yn(v) {
  return v ? "yes" : "no";
}

function runCheck(scriptPath) {
  return runCheckScript(scriptPath, { stdio: "ignore" }).ok;
}

const health = readJsonSafe(resolve(process.cwd(), RULE_ENGINE_V2_DOC_PATHS.health)) || {};
const trend = readJsonSafe(resolve(process.cwd(), RULE_ENGINE_V2_DOC_PATHS.milestoneTrend)) || {};
const READY_PHASES_V2 = CHECK_MANIFEST_SETS_BY_NAME_V2.ready || [];
const REGRESSION_CHECKS_V2 = CHECK_MANIFEST_SETS_BY_NAME_V2.regression || [];
const CONTRACT_CHECKS_V2 = CHECK_MANIFEST_SETS_BY_NAME_V2.contract || [];
const manifestChecks = buildManifestValidatorChecks(
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  CHECK_MANIFEST_VALIDATORS_V2,
  runCheck
);
const manifestBooleans = buildBooleanMapFromOrder(
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  manifestChecks
);
const manifestStatusSummary = formatOrderedBooleanSummary(
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  manifestChecks,
  yn
);
const readyPhaseResults = buildCheckResults(READY_PHASES_V2, runCheck);
const readyPhaseStatusList = formatCheckStatusList(READY_PHASES_V2, readyPhaseResults.byId, yn);
const contractResults = buildCheckResults(CONTRACT_CHECKS_V2, runCheck);
const contractStatusList = formatCheckStatusList(CONTRACT_CHECKS_V2, contractResults.byId, yn);
const regressionResults = buildCheckResults(REGRESSION_CHECKS_V2, runCheck);
const regressionStatusList = formatCheckStatusList(REGRESSION_CHECKS_V2, regressionResults.byId, yn);

const lines = [
  "[status:v2] ---",
  `[status:v2] spellbook ok: ${yn(health.spellbookOk === true)}`,
  `[status:v2] interactions ok: ${yn(health.interactionsOk === true)}`,
  `[status:v2] bootstrap uses v2: ${yn(health.bootstrapUsesV2Adapter === true)}`,
  `[status:v2] rules projection only: ${yn(health.projectionRulesOnly === true)}`,
  `[status:v2] rules (interactions/projection): ${Number(health.interactionsRuleCount || 0)}/${Number(health.projectedRuleCount || 0)}`,
  `[status:v2] drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `[status:v2] manifests (ready/contract/regression): ${manifestStatusSummary}`,
  `[status:v2] ready phases ok: ${yn(readyPhaseResults.ok)}`,
  `[status:v2] ready phases: ${readyPhaseStatusList}`,
  `[status:v2] regressions ok: ${yn(regressionResults.ok)}`,
  `[status:v2] regressions: ${regressionStatusList}`,
  `[status:v2] contracts ok: ${yn(contractResults.ok)}`,
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
  manifests: manifestBooleans,
  readyPhases: buildCheckBooleanMap(READY_PHASES_V2, readyPhaseResults.byId),
  regressions: buildCheckBooleanMap(REGRESSION_CHECKS_V2, regressionResults.byId),
  contracts: buildCheckBooleanMap(CONTRACT_CHECKS_V2, contractResults.byId),
  summary: {
    readyPhasesOk: readyPhaseResults.ok,
    regressionsOk: regressionResults.ok,
    contractsOk: contractResults.ok,
  },
  trend: {
    totalRuns: Number(trend.totalRuns || 0),
    passRateAllPct: Number(trend.passRateAllPct || 0),
    passRateRecentPct: Number(trend.passRateRecentPct || 0),
    latestPass: trend.latestPass === true,
    latestGitRef: String(trend.latestGitRef || "").trim(),
  },
};

const statusPath = resolve(process.cwd(), RULE_ENGINE_V2_DOC_PATHS.status);
writeJsonFile(statusPath, statusArtifact);
console.log(`[status:v2] wrote status: ${statusPath}`);
