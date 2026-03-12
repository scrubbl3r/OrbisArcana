import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { REQUIRED_REGRESSION_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runManifestIdCheck } from "./run-manifest-id-check-v2.mjs";

const CHECK_TAG = "regression-manifest:v2";

runManifestIdCheck({
  tag: CHECK_TAG,
  entries: REGRESSION_CHECKS_V2,
  requiredIds: REQUIRED_REGRESSION_CHECK_IDS_V2,
  manifestName: "REGRESSION_CHECKS_V2",
});

reportCheckPass(CHECK_TAG, "regression manifest integrity verified");
