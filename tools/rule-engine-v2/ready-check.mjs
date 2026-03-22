// Executes manifest validators and all non-validator checks for `ready:v2`.
import { flattenManifestChecksV2 } from "./manifest-check-entries-v2.mjs";
import { MANIFEST_VALIDATORS_V2, isManifestValidatorScriptV2 } from "./manifest-validators-v2.mjs";
import { runCheckScriptOrFailStatus } from "./run-check-fail-status-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
// Ready runner is intentionally strict: any validator/check failure exits immediately.
// Manifest validators run first to fail early on registry drift.
const CHECK_TAG = "ready:v2";
const PASS_MESSAGE = "runtime health is green";
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

function formatReadyFailureMessage(prefix, id) {
  return `${prefix}: ${id}`;
}

function asList(entries) {
  return Array.isArray(entries) ? entries : [];
}

function runReadyChecks(entries, failurePrefix, getId) {
  for (const entry of asList(entries)) {
    const rawId = getId(entry);
    const id = typeof rawId === "string" ? rawId.trim() : "";
    runReadyCheck({
      message: formatReadyFailureMessage(failurePrefix, id),
      script: entry?.script,
    });
  }
}

runReadyChecks(MANIFEST_VALIDATORS_V2, READY_FAILURE_PREFIX.validator, (entry) => entry?.name);

const nonValidatorChecks = flattenManifestChecksV2().filter((entry) => !isManifestValidatorScriptV2(entry.script));
runReadyChecks(nonValidatorChecks, READY_FAILURE_PREFIX.check, (entry) => entry?.id);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
