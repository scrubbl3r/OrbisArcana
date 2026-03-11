import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { validateManifestEntries } from "./validate-manifest-v2.mjs";

function fail(msg) {
  console.error(`[contract-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

try {
  validateManifestEntries({
    entries: CONTRACT_CHECKS_V2,
    manifestName: "CONTRACT_CHECKS_V2",
    entryLabel: "manifest",
  });
} catch (err) {
  fail(err?.message || String(err));
}

console.log("[contract-manifest:v2] PASS: contract manifest integrity verified");
