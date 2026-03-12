import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REQUIRED_READY_PHASE_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import {
  MANIFEST_CHECK_GROUP_NAMES_V2,
  flattenManifestChecksExcludingV2,
} from "./manifest-check-entries-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { findSharedScripts } from "./manifest-collision-utils-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { runManifestIntegrityCheckV2 } from "./run-manifest-integrity-v2.mjs";

const CHECK_TAG = "ready-phases-manifest:v2";

runManifestIntegrityCheckV2({
  tag: CHECK_TAG,
  entries: READY_PHASES_V2,
  requiredIds: REQUIRED_READY_PHASE_IDS_V2,
  manifestName: "READY_PHASES_V2",
  reportPass: false,
  entryLabel: "phase",
  itemLabel: "phase",
});

const overlaps = findSharedScripts(
  READY_PHASES_V2,
  flattenManifestChecksExcludingV2(MANIFEST_CHECK_GROUP_NAMES_V2.ready)
);
if (overlaps.length) {
  failCheck(
    CHECK_TAG,
    `READY_PHASES_V2 must not duplicate regression/contract scripts (overlap: ${overlaps.join(", ")})`
  );
}

reportCheckPass(CHECK_TAG, "ready phase manifest integrity verified");
