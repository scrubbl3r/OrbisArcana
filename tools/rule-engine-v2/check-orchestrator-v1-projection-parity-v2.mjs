import {
  INTERACTIONS_V2,
  buildRulesFromInteractionsV2,
  projectOrchestratorV1FromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { buildRuleEngineFromOrchestratorV1 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v1.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-parity:v2";

const projectedRules = buildRulesFromInteractionsV2(INTERACTIONS_V2);
if (!Array.isArray(projectedRules) || !projectedRules.length) {
  failCheck(CHECK_TAG, "projected interactions rules missing");
}

const orchestratorProjection = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);

let rebuilt;
try {
  rebuilt = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: orchestratorProjection,
    baseRuleEngine: Object.freeze({ version: "2", rules: [] }),
  });
} catch (err) {
  failCheck(CHECK_TAG, `orchestrator projection build failed: ${err instanceof Error ? err.message : String(err)}`);
}

const rebuiltRules = Array.isArray(rebuilt && rebuilt.rules) ? rebuilt.rules : [];
const lhs = JSON.stringify(projectedRules);
const rhs = JSON.stringify(rebuiltRules);
if (lhs !== rhs) {
  failCheckWithDetails(CHECK_TAG, "projection mismatch between interactions and orchestrator compiler", [
    `interactions rules: ${lhs}`,
    `orchestrator rules: ${rhs}`,
  ]);
}

reportCheckPass(CHECK_TAG, "orchestrator projection parity holds against interactions projection");
