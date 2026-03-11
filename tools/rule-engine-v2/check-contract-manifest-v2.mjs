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

const requiredContractIds = Object.freeze([
  "rule_source",
  "policy_alias",
  "runtime_import",
  "doc_policy",
  "validator_policy",
  "compat_surface",
  "import_boundary",
  "health_contract",
  "cross_manifest_integrity",
]);
const contractIds = CONTRACT_CHECKS_V2.map((check) => String(check?.id || "").trim());
if (contractIds.length !== requiredContractIds.length) {
  fail(`CONTRACT_CHECKS_V2 must contain exactly ${requiredContractIds.length} checks (got ${contractIds.length})`);
}
for (let i = 0; i < requiredContractIds.length; i += 1) {
  if (contractIds[i] !== requiredContractIds[i]) {
    fail(`CONTRACT_CHECKS_V2 order mismatch at index ${i}: expected '${requiredContractIds[i]}' got '${contractIds[i] || "(missing)"}'`);
  }
}

console.log("[contract-manifest:v2] PASS: contract manifest integrity verified");
