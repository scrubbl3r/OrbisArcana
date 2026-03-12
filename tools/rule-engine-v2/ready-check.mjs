import {
  CHECK_MANIFEST_SET_ORDER_V2,
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  CHECK_MANIFEST_VALIDATORS_V2,
  getCheckManifestEntriesGroupV2,
  getCheckManifestValidatorScriptsV2,
} from "./check-manifests-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { failCheckStatus } from "./check-fail-v2.mjs";

const validatorScripts = new Set(
  getCheckManifestValidatorScriptsV2(CHECK_MANIFEST_VALIDATOR_ORDER_V2)
);

for (const validatorName of CHECK_MANIFEST_VALIDATOR_ORDER_V2) {
  const script = CHECK_MANIFEST_VALIDATORS_V2[validatorName];
  if (!script) continue;
  const res = runCheckScript(script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus("ready:v2", `validator failed: ${validatorName}`, res.status || 1);
}

for (const entry of getCheckManifestEntriesGroupV2(CHECK_MANIFEST_SET_ORDER_V2)) {
  if (validatorScripts.has(entry.script)) continue;
  const res = runCheckScript(entry.script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus("ready:v2", `check failed: ${entry.id}`, res.status || 1);
}

console.log("[ready:v2] PASS: cutover health is green");
