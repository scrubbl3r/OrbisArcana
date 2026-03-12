import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { REQUIRED_REGRESSION_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { runManifestIntegrityCheckV2 } from "./run-manifest-integrity-v2.mjs";

const CHECK_TAG = "regression-manifest:v2";

runManifestIntegrityCheckV2({
  tag: CHECK_TAG,
  entries: REGRESSION_CHECKS_V2,
  requiredIds: REQUIRED_REGRESSION_CHECK_IDS_V2,
  manifestName: "REGRESSION_CHECKS_V2",
  passMessage: "regression manifest integrity verified",
});
