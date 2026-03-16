import {
  ORCHESTRATOR_V1,
  ORCHESTRATOR_V1_BOOTSTRAP,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-bootstrap-defaults:v2";

if (!ORCHESTRATOR_V1_BOOTSTRAP || typeof ORCHESTRATOR_V1_BOOTSTRAP !== "object") {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1_BOOTSTRAP export missing");
}
if (ORCHESTRATOR_V1_BOOTSTRAP.useInReceiverBootstrap !== false) {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1 bootstrap must remain disabled by default");
}
if (ORCHESTRATOR_V1_BOOTSTRAP.projectFromInteractionsWhenOrchestratorEmpty !== true) {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1 projection bridge default must remain enabled");
}

if (!ORCHESTRATOR_V1 || typeof ORCHESTRATOR_V1 !== "object") {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1 export missing");
}
if (String(ORCHESTRATOR_V1.version || "") !== "1") {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1.version must be \"1\"");
}
if (!Array.isArray(ORCHESTRATOR_V1.rules)) {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1.rules must be an array");
}
if (ORCHESTRATOR_V1.rules.length !== 0) {
  failCheck(CHECK_TAG, "ORCHESTRATOR_V1.rules must remain empty until cutover activation");
}

reportCheckPass(CHECK_TAG, "orchestrator bootstrap defaults remain in safe pre-cutover state");
