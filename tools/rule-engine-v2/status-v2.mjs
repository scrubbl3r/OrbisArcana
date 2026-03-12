import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import {
  MANIFEST_VALIDATORS_V2,
  MANIFEST_VALIDATOR_NAMES_V2,
} from "./manifest-validators-v2.mjs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { readJsonSafe } from "./read-json-safe-v2.mjs";
import { isTrue } from "./bool-utils-v2.mjs";
import { toNumberOr, toTrimmedText } from "./value-utils-v2.mjs";
import {
  buildCheckBooleanMap,
  buildCheckResultsByKey,
  buildCheckResultsWithStatusList,
  buildOrderedBooleanArtifacts,
} from "./status-checks-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";

const CHECK_TAG = "status:v2";
const logStatus = createTaggedLogger(CHECK_TAG);
const manifestValidators = MANIFEST_VALIDATORS_V2;

function yn(v) {
  return v ? "yes" : "no";
}

function runCheck(scriptPath) {
  return runCheckScript(scriptPath, { stdio: "ignore" }).ok;
}

const health = readJsonSafe(resolveRuleEngineDocPath("health")) || {};
const trend = readJsonSafe(resolveRuleEngineDocPath("milestoneTrend")) || {};
const manifestValidatorOrder = MANIFEST_VALIDATOR_NAMES_V2;
const manifestChecks = buildCheckResultsByKey(manifestValidators, runCheck, "name").byKey;
const manifestArtifacts = buildOrderedBooleanArtifacts(
  manifestValidatorOrder,
  manifestChecks,
  yn
);
const readyPhaseCheck = buildCheckResultsWithStatusList(READY_PHASES_V2, runCheck, yn);
const contractCheck = buildCheckResultsWithStatusList(CONTRACT_CHECKS_V2, runCheck, yn);
const regressionCheck = buildCheckResultsWithStatusList(REGRESSION_CHECKS_V2, runCheck, yn);
const readyPhaseResults = readyPhaseCheck.results;
const contractResults = contractCheck.results;
const regressionResults = regressionCheck.results;

const lines = [
  "---",
  `spellbook ok: ${yn(isTrue(health.spellbookOk))}`,
  `interactions ok: ${yn(isTrue(health.interactionsOk))}`,
  `bootstrap uses v2: ${yn(isTrue(health.bootstrapUsesV2Adapter))}`,
  `rules projection only: ${yn(isTrue(health.projectionRulesOnly))}`,
  `rules (interactions/projection): ${toNumberOr(health.interactionsRuleCount)}/${toNumberOr(health.projectedRuleCount)}`,
  `drift ids: ${Array.isArray(health.driftRuleIds) ? health.driftRuleIds.length : 0}`,
  `manifests (ready/contract/regression): ${manifestArtifacts.summary}`,
  `ready phases ok: ${yn(readyPhaseResults.ok)}`,
  `ready phases: ${readyPhaseCheck.statusList}`,
  `regressions ok: ${yn(regressionResults.ok)}`,
  `regressions: ${regressionCheck.statusList}`,
  `contracts ok: ${yn(contractResults.ok)}`,
  `contracts: ${contractCheck.statusList}`,
  `milestone runs: ${toNumberOr(trend.totalRuns)}`,
  `pass rate all/recent: ${toNumberOr(trend.passRateAllPct)}% / ${toNumberOr(trend.passRateRecentPct)}%`,
  `latest milestone: ${isTrue(trend.latestPass) ? "PASS" : "FAIL"} ${toTrimmedText(trend.latestGitRef)}`,
  "---",
];

for (const line of lines) logStatus(line);

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
  manifests: manifestArtifacts.booleans,
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
logStatus(`wrote status: ${statusPath}`);
