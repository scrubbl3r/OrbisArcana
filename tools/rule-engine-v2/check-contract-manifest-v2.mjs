import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { REQUIRED_CONTRACT_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";
import { runOrFail } from "./check-run-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

runOrFail("contract-manifest:v2", () => {
  assertManifestIdContract({
    entries: CONTRACT_CHECKS_V2,
    manifestName: "CONTRACT_CHECKS_V2",
    entryLabel: "manifest",
    itemLabel: "check",
    requiredIds: REQUIRED_CONTRACT_CHECK_IDS_V2,
  });
});

reportCheckPass("contract-manifest:v2", "contract manifest integrity verified");
