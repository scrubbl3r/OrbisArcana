import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { REQUIRED_CONTRACT_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";

function fail(msg) {
  console.error(`[contract-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

try {
  assertManifestIdContract({
    entries: CONTRACT_CHECKS_V2,
    manifestName: "CONTRACT_CHECKS_V2",
    entryLabel: "manifest",
    itemLabel: "check",
    requiredIds: REQUIRED_CONTRACT_CHECK_IDS_V2,
  });
} catch (err) {
  fail(err?.message || String(err));
}

console.log("[contract-manifest:v2] PASS: contract manifest integrity verified");
