import { ALL_MANIFEST_CHECKS_V2 } from "./manifest-check-entries-v2.mjs";
import {
  MANIFEST_VALIDATORS_V2,
  isManifestValidatorScriptV2,
} from "./manifest-validators-v2.mjs";
import { runCheckScriptOrFailStatus } from "./run-check-fail-status-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "ready:v2";

for (const validator of MANIFEST_VALIDATORS_V2) {
  runCheckScriptOrFailStatus({
    tag: CHECK_TAG,
    message: `validator failed: ${validator.name}`,
    script: validator.script,
  });
}

for (const entry of ALL_MANIFEST_CHECKS_V2) {
  if (isManifestValidatorScriptV2(entry.script)) continue;
  runCheckScriptOrFailStatus({
    tag: CHECK_TAG,
    message: `check failed: ${entry.id}`,
    script: entry.script,
  });
}

reportCheckPass(CHECK_TAG, "cutover health is green");
