import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REQUIRED_CONTRACT_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { runManifestIntegrityCheckV2 } from "./run-manifest-integrity-v2.mjs";

// Verifies the contract manifest has required IDs before ready phase execution.
// Uses shared manifest-integrity wrapper for consistent diagnostics.
// Contract manifest is intentionally large; this check protects against silent drift.
const CHECK_TAG = "contract-manifest:v2";
const MANIFEST_NAME = "CONTRACT_CHECKS_V2";
const PASS_MESSAGE = "contract manifest integrity verified";

runManifestIntegrityCheckV2({
  tag: CHECK_TAG,
  entries: CONTRACT_CHECKS_V2,
  requiredIds: REQUIRED_CONTRACT_CHECK_IDS_V2,
  manifestName: MANIFEST_NAME,
  passMessage: PASS_MESSAGE,
});
