import {
  CHECK_MANIFEST_SETS_BY_NAME_V2,
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  CHECK_MANIFEST_VALIDATORS_V2,
} from "./check-manifests-v2.mjs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { toNumberOr, toTrimmedText } from "./value-utils-v2.mjs";
import { formatCheckStatusList } from "./status-format-v2.mjs";
import {
  buildCheckBooleanMap,
  buildCheckResults,
  buildBooleanMapFromOrder,
  buildManifestValidatorChecks,
  formatOrderedBooleanSummary,
} from "./status-checks-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";

function yn(v) {
  return v ? "yes" : "no";
}

function runCheck(scriptPath) {
  return runCheckScript(scriptPath, { stdio: "ignore" }).ok;
}

const health = readJsonSafe(resolveRuleEngineDocPath("health")) || {};
const trend = readJsonSafe(resolveRuleEngineDocPath("milestoneTrend")) || {};
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
  `[status:v2] spellbook ok: ${yn(isTrue(health.spellbookOk))}`,
  `[status:v2] interactions ok: ${yn(isTrue(health.interactionsOk))}`,
  `[status:v2] bootstrap uses v2: ${yn(isTrue(health.bootstrapUsesV2Adapter))}`,
  `[status:v2] rules projection only: ${yn(isTrue(health.projectionRulesOnly))}`,
  `[status:v2] rules (interactions/projection): ${toNumberOr(health.interactionsRuleCount)}/${toNumberOr(health.projectedRuleCount)}`,
  `[status:v2] drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `[status:v2] manifests (ready/contract/regression): ${manifestStatusSummary}`,
  `[status:v2] ready phases ok: ${yn(readyPhaseResults.ok)}`,
  `[status:v2] ready phases: ${readyPhaseStatusList}`,
  `[status:v2] regressions ok: ${yn(regressionResults.ok)}`,
  `[status:v2] regressions: ${regressionStatusList}`,
  `[status:v2] contracts ok: ${yn(contractResults.ok)}`,
  `[status:v2] contracts: ${contractStatusList}`,
  `[status:v2] milestone runs: ${toNumberOr(trend.totalRuns)}`,
  `[status:v2] pass rate all/recent: ${toNumberOr(trend.passRateAllPct)}% / ${toNumberOr(trend.passRateRecentPct)}%`,
  `[status:v2] latest milestone: ${isTrue(trend.latestPass) ? "PASS" : "FAIL"} ${toTrimmedText(trend.latestGitRef)}`,
  "[status:v2] ---",
];

for (const line of lines) console.log(line);

const statusArtifact = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.status,
  generatedAt: nowIso(),
  health: {
    spellbookOk: isTrue(health.spellbookOk),
    interactionsOk: isTrue(health.interactionsOk),
    bootstrapUsesV2Adapter: isTrue(health.bootstrapUsesV2Adapter),
    projectionRulesOnly: isTrue(health.projectionRulesOnly),
    interactionsRuleCount: toNumberOr(health.interactionsRuleCount),
    projectedRuleCount: toNumberOr(health.projectedRuleCount),
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
    totalRuns: toNumberOr(trend.totalRuns),
    passRateAllPct: toNumberOr(trend.passRateAllPct),
    passRateRecentPct: toNumberOr(trend.passRateRecentPct),
    latestPass: isTrue(trend.latestPass),
    latestGitRef: toTrimmedText(trend.latestGitRef),
  },
};

const statusPath = resolveRuleEngineDocPath("status");
writeJsonFile(statusPath, statusArtifact);
console.log(`[status:v2] wrote status: ${statusPath}`);
