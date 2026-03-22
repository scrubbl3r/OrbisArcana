import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REQUIRED_READY_PHASE_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { MANIFEST_CHECK_GROUP_NAMES_V2, flattenManifestChecksExcludingV2 } from "./manifest-check-entries-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { findSharedScripts } from "./manifest-collision-utils-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runManifestIntegrityCheckV2 } from "./run-manifest-integrity-v2.mjs";

// This check enforces both id contract and cross-manifest script exclusivity.
const CHECK_TAG = "ready-phases-manifest:v2";
const MANIFEST_NAME = "READY_PHASES_V2";
const PHASE_LABEL = "phase";
const OVERLAP_LABEL = "overlap";
const PASS_MESSAGE = "ready phase manifest integrity verified";

runManifestIntegrityCheckV2({
  tag: CHECK_TAG,
  entries: READY_PHASES_V2,
  requiredIds: REQUIRED_READY_PHASE_IDS_V2,
  manifestName: MANIFEST_NAME,
  reportPass: false,
  entryLabel: PHASE_LABEL,
  itemLabel: PHASE_LABEL,
});

const overlaps = findSharedScripts(
  READY_PHASES_V2,
  flattenManifestChecksExcludingV2(MANIFEST_CHECK_GROUP_NAMES_V2.ready)
);
if (overlaps.length) {
  failCheck(
    CHECK_TAG,
    `${MANIFEST_NAME} must not duplicate regression/contract scripts (${OVERLAP_LABEL}: ${overlaps.join(", ")})`
  );
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
