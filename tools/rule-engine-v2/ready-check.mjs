import {
  flattenManifestChecksV2,
} from "./manifest-check-entries-v2.mjs";
import {
  MANIFEST_VALIDATORS_V2,
  isManifestValidatorScriptV2,
} from "./manifest-validators-v2.mjs";
import { runCheckScriptOrFailStatus } from "./run-check-fail-status-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "ready:v2";
const READY_FAILURE_PREFIX = Object.freeze({
  validator: "validator failed",
  check: "check failed",
});

function runReadyCheck({ message, script }) {
  runCheckScriptOrFailStatus({
    tag: CHECK_TAG,
    message,
    script,
  });
}

for (const validator of MANIFEST_VALIDATORS_V2) {
  runReadyCheck({
    message: `${READY_FAILURE_PREFIX.validator}: ${validator.name}`,
    script: validator.script,
  });
}

for (const entry of flattenManifestChecksV2()) {
  if (isManifestValidatorScriptV2(entry.script)) continue;
  runReadyCheck({
    message: `${READY_FAILURE_PREFIX.check}: ${entry.id}`,
    script: entry.script,
  });
}

reportCheckPass(CHECK_TAG, "cutover health is green");
