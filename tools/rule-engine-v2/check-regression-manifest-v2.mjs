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

const requiredRegressionIds = Object.freeze([
  "shake_regression",
  "wake_load_regression",
  "immediate_ownership",
  "flat_spin_gating",
  "wake_window_axis_prereq",
]);
const regressionIds = REGRESSION_CHECKS_V2.map((check) => String(check?.id || "").trim());
if (regressionIds.length !== requiredRegressionIds.length) {
  fail(`REGRESSION_CHECKS_V2 must contain exactly ${requiredRegressionIds.length} checks (got ${regressionIds.length})`);
}
for (let i = 0; i < requiredRegressionIds.length; i += 1) {
  if (regressionIds[i] !== requiredRegressionIds[i]) {
    fail(`REGRESSION_CHECKS_V2 order mismatch at index ${i}: expected '${requiredRegressionIds[i]}' got '${regressionIds[i] || "(missing)"}'`);
  }
}

console.log("[regression-manifest:v2] PASS: regression manifest integrity verified");
