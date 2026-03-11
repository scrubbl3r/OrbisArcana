import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { assertManifestIdContract } from "./assert-manifest-id-contract-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REQUIRED_READY_PHASE_IDS_V2 } from "./manifest-contract-ids-v2.mjs";

function fail(msg) {
  console.error(`[ready-phases-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

try {
  assertManifestIdContract({
    entries: READY_PHASES_V2,
    requiredIds: REQUIRED_READY_PHASE_IDS_V2,
    manifestName: "READY_PHASES_V2",
    entryLabel: "phase",
    itemLabel: "phase",
  });
} catch (err) {
  fail(err?.message || String(err));
}

const readyScripts = new Set(READY_PHASES_V2.map((phase) => String(phase.script || "").trim()));
const overlaps = [];
for (const check of [...REGRESSION_CHECKS_V2, ...CONTRACT_CHECKS_V2]) {
  const script = String(check?.script || "").trim();
  if (readyScripts.has(script)) overlaps.push(script);
}
if (overlaps.length) {
  fail(`READY_PHASES_V2 must not duplicate regression/contract scripts (overlap: ${[...new Set(overlaps)].join(", ")})`);
}

console.log("[ready-phases-manifest:v2] PASS: ready phase manifest integrity verified");
