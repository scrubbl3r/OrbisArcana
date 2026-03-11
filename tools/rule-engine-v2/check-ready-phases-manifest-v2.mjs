import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REQUIRED_READY_PHASE_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { findSharedScripts } from "./manifest-collision-utils-v2.mjs";
import { runOrFail } from "./check-run-v2.mjs";

runOrFail("ready-phases-manifest:v2", () => {
  assertManifestIdContract({
    entries: READY_PHASES_V2,
    requiredIds: REQUIRED_READY_PHASE_IDS_V2,
    manifestName: "READY_PHASES_V2",
    entryLabel: "phase",
    itemLabel: "phase",
  });
});

const overlaps = findSharedScripts(READY_PHASES_V2, [...REGRESSION_CHECKS_V2, ...CONTRACT_CHECKS_V2]);
if (overlaps.length) {
  failCheck(
    "ready-phases-manifest:v2",
    `READY_PHASES_V2 must not duplicate regression/contract scripts (overlap: ${overlaps.join(", ")})`
  );
}

console.log("[ready-phases-manifest:v2] PASS: ready phase manifest integrity verified");
