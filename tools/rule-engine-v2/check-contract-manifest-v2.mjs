import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REQUIRED_CONTRACT_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runManifestIdCheck } from "./run-manifest-id-check-v2.mjs";

const CHECK_TAG = "contract-manifest:v2";

runManifestIdCheck({
  tag: CHECK_TAG,
  entries: CONTRACT_CHECKS_V2,
  requiredIds: REQUIRED_CONTRACT_CHECK_IDS_V2,
  manifestName: "CONTRACT_CHECKS_V2",
});

reportCheckPass(CHECK_TAG, "contract manifest integrity verified");
