import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { buildRuleEngineFromCompiledInteractionGraphV2, COMPILED_INTERACTION_GRAPH_V2 } from "../../src/content/interactions-v2/index.js";

// Validates orchestrator projection section fields inside master-control artifact.
const CHECK_TAG = "master-control-orchestrator-section:v2";
const PROJECTION_KEY = "orchestratorProjection";
const PROJECTION_VERSION_KEY = `${PROJECTION_KEY}.version`;
const PROJECTION_ENABLED_KEY = `${PROJECTION_KEY}.enabled`;
const PROJECTION_RULE_COUNT_KEY = `${PROJECTION_KEY}.ruleCount`;
const PROJECTION_PARITY_KEY = `${PROJECTION_KEY}.parityWithOrchestratorRuleCount`;
const PASS_MESSAGE = "master-control orchestrator projection section is present and valid";

const doc = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.masterControlJson);
if (!doc || typeof doc !== "object") {
  failCheck(CHECK_TAG, "master-control json root missing");
}

const section = doc[PROJECTION_KEY];
if (!section || typeof section !== "object") {
  failCheck(CHECK_TAG, `master-control json missing ${PROJECTION_KEY} section`);
}

const expectedVersion = typeof COMPILED_INTERACTION_GRAPH_V2?.version === "string" ? COMPILED_INTERACTION_GRAPH_V2.version : "";
const expectedEnabled = COMPILED_INTERACTION_GRAPH_V2?.enabled !== false;
const expectedAuthoredRules = Array.isArray(COMPILED_INTERACTION_GRAPH_V2?.rules) ? COMPILED_INTERACTION_GRAPH_V2.rules : [];
const expectedCompiledEngine = buildRuleEngineFromCompiledInteractionGraphV2();
const expectedCompiledRules = Array.isArray(expectedCompiledEngine?.rules) ? expectedCompiledEngine.rules : [];
const sectionVersion = typeof section.version === "string" ? section.version : "";

if (sectionVersion !== expectedVersion) {
  failCheck(CHECK_TAG, `${PROJECTION_VERSION_KEY} mismatch: ${section.version}`);
}
if (section.enabled !== expectedEnabled) {
  failCheck(CHECK_TAG, `${PROJECTION_ENABLED_KEY} mismatch: ${section.enabled}`);
}
const sectionRuleCount = Number(section.ruleCount);
if (sectionRuleCount !== expectedCompiledRules.length) {
  failCheck(CHECK_TAG, `${PROJECTION_RULE_COUNT_KEY} mismatch: ${section.ruleCount}`);
}
const expectedParity = expectedCompiledRules.length === expectedAuthoredRules.length;
if (section.parityWithOrchestratorRuleCount !== expectedParity) {
  failCheck(
    CHECK_TAG,
    `${PROJECTION_PARITY_KEY} mismatch: ${section.parityWithOrchestratorRuleCount}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
