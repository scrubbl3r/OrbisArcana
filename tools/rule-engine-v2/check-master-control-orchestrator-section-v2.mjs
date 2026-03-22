import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { INTERACTIONS_V2, projectOrchestratorV1FromInteractionsV2 } from "../../src/content/interactions-v2/index.js";
import { getInteractionsRules } from "./interactions-v2-utils.mjs";

// Validates orchestrator projection section fields inside master-control artifact.
const CHECK_TAG = "master-control-orchestrator-section:v2";
const PROJECTION_KEY = "orchestratorProjection";
const PROJECTION_VERSION_KEY = `${PROJECTION_KEY}.version`;
const PROJECTION_ENABLED_KEY = `${PROJECTION_KEY}.enabled`;
const PROJECTION_RULE_COUNT_KEY = `${PROJECTION_KEY}.ruleCount`;
const PROJECTION_PARITY_KEY = `${PROJECTION_KEY}.parityWithInteractionsRuleCount`;
const PASS_MESSAGE = "master-control orchestrator projection section is present and valid";

const doc = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.masterControlJson);
if (!doc || typeof doc !== "object") {
  failCheck(CHECK_TAG, "master-control json root missing");
}

const section = doc[PROJECTION_KEY];
if (!section || typeof section !== "object") {
  failCheck(CHECK_TAG, `master-control json missing ${PROJECTION_KEY} section`);
}

const expectedProjection = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
const expectedRules = Array.isArray(expectedProjection?.rules) ? expectedProjection.rules : [];
const expectedInteractionsRules = getInteractionsRules(INTERACTIONS_V2);
const sectionVersion = typeof section.version === "string" ? section.version : "";
const expectedVersion = typeof expectedProjection?.version === "string" ? expectedProjection.version : "";

if (sectionVersion !== expectedVersion) {
  failCheck(CHECK_TAG, `${PROJECTION_VERSION_KEY} mismatch: ${section.version}`);
}
if (section.enabled !== (expectedProjection?.enabled !== false)) {
  failCheck(CHECK_TAG, `${PROJECTION_ENABLED_KEY} mismatch: ${section.enabled}`);
}
const sectionRuleCount = Number(section.ruleCount);
if (sectionRuleCount !== expectedRules.length) {
  failCheck(CHECK_TAG, `${PROJECTION_RULE_COUNT_KEY} mismatch: ${section.ruleCount}`);
}
const expectedParity = expectedRules.length === expectedInteractionsRules.length;
if (section.parityWithInteractionsRuleCount !== expectedParity) {
  failCheck(
    CHECK_TAG,
    `${PROJECTION_PARITY_KEY} mismatch: ${section.parityWithInteractionsRuleCount}`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
