import { ALL_MANIFEST_CHECKS_V2 } from "./manifest-check-entries-v2.mjs";
import {
  MANIFEST_VALIDATORS_V2,
  isManifestValidatorScriptV2,
} from "./manifest-validators-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { failCheckStatus } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "ready:v2";

const validators = MANIFEST_VALIDATORS_V2;
const checks = ALL_MANIFEST_CHECKS_V2;

for (const validator of validators) {
  const script = validator.script;
  const res = runCheckScript(script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `validator failed: ${validator.name}`, res.status || 1);
}

for (const entry of checks) {
  if (isManifestValidatorScriptV2(entry.script)) continue;
  const res = runCheckScript(entry.script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `check failed: ${entry.id}`, res.status || 1);
}

reportCheckPass(CHECK_TAG, "cutover health is green");
