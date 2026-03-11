import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { validateManifestEntries } from "./validate-manifest-v2.mjs";

function fail(msg) {
  console.error(`[regression-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

try {
  validateManifestEntries({
    entries: REGRESSION_CHECKS_V2,
    manifestName: "REGRESSION_CHECKS_V2",
    entryLabel: "manifest",
  });
} catch (err) {
  fail(err?.message || String(err));
}

console.log("[regression-manifest:v2] PASS: regression manifest integrity verified");
