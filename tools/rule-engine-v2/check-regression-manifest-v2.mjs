import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { REQUIRED_REGRESSION_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { runManifestIntegrityCheckV2 } from "./run-manifest-integrity-v2.mjs";

// Verifies regression manifest entries and required IDs remain intact.
// Keeps regression-manifest validation aligned with shared manifest checks.
const CHECK_TAG = "regression-manifest:v2";
const MANIFEST_NAME = "REGRESSION_CHECKS_V2";
const PASS_MESSAGE = "regression manifest integrity verified";

runManifestIntegrityCheckV2({
  tag: CHECK_TAG,
  entries: REGRESSION_CHECKS_V2,
  requiredIds: REQUIRED_REGRESSION_CHECK_IDS_V2,
  manifestName: MANIFEST_NAME,
  passMessage: PASS_MESSAGE,
});
