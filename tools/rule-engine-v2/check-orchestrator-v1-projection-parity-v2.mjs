import {
  INTERACTIONS_V2,
  INTERACTIONS_V2_BOOTSTRAP,
  buildRulesFromInteractionsV2,
  projectOrchestratorV1FromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { buildRuleEngineFromOrchestratorV1 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v1.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-parity:v2";
const PASS_MESSAGE = "orchestrator projection parity holds against interactions projection";
const LEGACY_OPTIONAL_PASS_MESSAGE = "orchestrator projection parity is legacy-optional when interactions bootstrap is disabled";

const interactionsBootstrapEnabled = !!(
  INTERACTIONS_V2_BOOTSTRAP &&
  INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap === true
);
if (!interactionsBootstrapEnabled) {
  reportCheckPass(CHECK_TAG, LEGACY_OPTIONAL_PASS_MESSAGE);
  process.exit(0);
}

function asRules(schemaLike) {
  return Array.isArray(schemaLike?.rules) ? schemaLike.rules : [];
}

function buildProjectionOrFail(orchestratorProjection) {
  try {
    return buildRuleEngineFromOrchestratorV1({
      orchestratorV1: orchestratorProjection,
      baseRuleEngine: Object.freeze({ version: "2", rules: [] }),
    });
  } catch (err) {
    const msg = err instanceof Error && typeof err.message === "string" && err.message
      ? err.message
      : "unknown error";
    failCheck(CHECK_TAG, `orchestrator projection build failed: ${msg}`);
  }
}

const projectedRules = buildRulesFromInteractionsV2(INTERACTIONS_V2);
if (!Array.isArray(projectedRules) || !projectedRules.length) {
  failCheck(CHECK_TAG, "projected interactions rules missing");
}

const orchestratorProjection = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
const rebuilt = buildProjectionOrFail(orchestratorProjection);
const rebuiltRules = asRules(rebuilt);
const lhs = JSON.stringify(projectedRules);
const rhs = JSON.stringify(rebuiltRules);
if (lhs !== rhs) {
  failCheckWithDetails(CHECK_TAG, "projection mismatch between interactions and orchestrator compiler", [
    `interactions rules: ${lhs}`,
    `orchestrator rules: ${rhs}`,
  ]);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
