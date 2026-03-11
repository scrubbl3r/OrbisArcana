import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { REQUIRED_REGRESSION_CHECK_IDS_V2 } from "./manifest-contract-ids-v2.mjs";

function fail(msg) {
  console.error(`[regression-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

try {
  assertManifestIdContract({
    entries: REGRESSION_CHECKS_V2,
    manifestName: "REGRESSION_CHECKS_V2",
    entryLabel: "manifest",
    itemLabel: "check",
    requiredIds: REQUIRED_REGRESSION_CHECK_IDS_V2,
  });
} catch (err) {
  fail(err?.message || String(err));
}

console.log("[regression-manifest:v2] PASS: regression manifest integrity verified");
