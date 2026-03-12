import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { REQUIRED_READY_PHASE_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { findSharedScripts } from "./manifest-collision-utils-v2.mjs";
import { runOrFail } from "./check-run-v2.mjs";
import { getCheckManifestEntriesV2 } from "./check-manifests-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

runOrFail("ready-phases-manifest:v2", () => {
  assertManifestIdContract({
    entries: READY_PHASES_V2,
    requiredIds: REQUIRED_READY_PHASE_IDS_V2,
    manifestName: "READY_PHASES_V2",
    entryLabel: "phase",
    itemLabel: "phase",
  });
});

const overlaps = findSharedScripts(
  READY_PHASES_V2,
  [...getCheckManifestEntriesV2("regression"), ...getCheckManifestEntriesV2("contract")]
);
if (overlaps.length) {
  failCheck(
    "ready-phases-manifest:v2",
    `READY_PHASES_V2 must not duplicate regression/contract scripts (overlap: ${overlaps.join(", ")})`
  );
}

reportCheckPass("ready-phases-manifest:v2", "ready phase manifest integrity verified");
