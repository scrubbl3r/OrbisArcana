import {
  CHECK_MANIFEST_SET_ORDER_V2,
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  getCheckManifestEntriesGroupV2,
  getCheckManifestValidatorScriptsV2,
  getCheckManifestValidatorsByOrderV2,
} from "./check-manifests-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { failCheckStatus } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "ready:v2";

const validatorScripts = new Set(
  getCheckManifestValidatorScriptsV2(CHECK_MANIFEST_VALIDATOR_ORDER_V2)
);

for (const validator of getCheckManifestValidatorsByOrderV2(CHECK_MANIFEST_VALIDATOR_ORDER_V2)) {
  const script = validator.script;
  const res = runCheckScript(script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `validator failed: ${validator.name}`, res.status || 1);
}

for (const entry of getCheckManifestEntriesGroupV2(CHECK_MANIFEST_SET_ORDER_V2)) {
  if (validatorScripts.has(entry.script)) continue;
  const res = runCheckScript(entry.script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `check failed: ${entry.id}`, res.status || 1);
}

reportCheckPass(CHECK_TAG, "cutover health is green");
