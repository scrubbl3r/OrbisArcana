import { ORCHESTRATOR_V1, ORCHESTRATOR_V1_BOOTSTRAP } from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-bootstrap-defaults:v2";
const PASS_MESSAGE = "orchestrator v1 bootstrap defaults remain in orchestrator-exclusive state";

function assertCondition(condition, failureMessage) {
  if (!condition) {
    failCheck(CHECK_TAG, failureMessage);
  }
}

if (!ORCHESTRATOR_V1_BOOTSTRAP || typeof ORCHESTRATOR_V1_BOOTSTRAP !== "object") {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1_BOOTSTRAP export missing");
}
assertCondition(
  ORCHESTRATOR_V1_BOOTSTRAP.useInReceiverBootstrap === true,
  "ORCHESTRATOR_V1 bootstrap must remain enabled by default"
);
assertCondition(
  ORCHESTRATOR_V1_BOOTSTRAP.projectFromInteractionsWhenOrchestratorEmpty === false,
  "ORCHESTRATOR_V1 projection bridge default must remain disabled in orchestrator-exclusive mode"
);

if (!ORCHESTRATOR_V1 || typeof ORCHESTRATOR_V1 !== "object") {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1 export missing");
}
const version = typeof ORCHESTRATOR_V1.version === "string" ? ORCHESTRATOR_V1.version : "";
assertCondition(version === "1", "ORCHESTRATOR_V1.version must be \"1\"");
assertCondition(Array.isArray(ORCHESTRATOR_V1.rules), "ORCHESTRATOR_V1.rules must be an array");
assertCondition(
  ORCHESTRATOR_V1.rules.length >= 1,
  "ORCHESTRATOR_V1.rules must include at least one active rule"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
