import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { validateManifestEntries } from "./validate-manifest-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";

function fail(msg) {
  console.error(`[ready-phases-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

try {
  validateManifestEntries({
    entries: READY_PHASES_V2,
    manifestName: "READY_PHASES_V2",
    entryLabel: "phase",
  });
} catch (err) {
  fail(err?.message || String(err));
}

const requiredPhaseIds = Object.freeze([
  "doctor",
  "regression_manifest",
  "contract_manifest",
  "master_control_authoring",
]);
const phaseIds = READY_PHASES_V2.map((phase) => String(phase.id || "").trim());
if (phaseIds.length !== requiredPhaseIds.length) {
  fail(`READY_PHASES_V2 must contain exactly ${requiredPhaseIds.length} phases (got ${phaseIds.length})`);
}
for (let i = 0; i < requiredPhaseIds.length; i += 1) {
  if (phaseIds[i] !== requiredPhaseIds[i]) {
    fail(`READY_PHASES_V2 phase order mismatch at index ${i}: expected '${requiredPhaseIds[i]}' got '${phaseIds[i] || "(missing)"}'`);
  }
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
