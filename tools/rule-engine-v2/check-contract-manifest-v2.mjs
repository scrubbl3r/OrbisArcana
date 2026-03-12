import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REQUIRED_CONTRACT_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { runManifestIntegrityCheckV2 } from "./run-manifest-integrity-v2.mjs";

const CHECK_TAG = "contract-manifest:v2";

runManifestIntegrityCheckV2({
  tag: CHECK_TAG,
  entries: CONTRACT_CHECKS_V2,
  requiredIds: REQUIRED_CONTRACT_CHECK_IDS_V2,
  manifestName: "CONTRACT_CHECKS_V2",
  passMessage: "contract manifest integrity verified",
});
