import {
  ALL_CHECK_MANIFEST_ENTRIES_V2,
  getCheckManifestValidatorsByOrderV2,
} from "./check-manifests-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { failCheckStatus } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "ready:v2";

const validators = getCheckManifestValidatorsByOrderV2();
const validatorScripts = new Set(validators.map((v) => v.script));

for (const validator of validators) {
  const script = validator.script;
  const res = runCheckScript(script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `validator failed: ${validator.name}`, res.status || 1);
}

for (const entry of ALL_CHECK_MANIFEST_ENTRIES_V2) {
  if (validatorScripts.has(entry.script)) continue;
  const res = runCheckScript(entry.script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `check failed: ${entry.id}`, res.status || 1);
}

reportCheckPass(CHECK_TAG, "cutover health is green");
