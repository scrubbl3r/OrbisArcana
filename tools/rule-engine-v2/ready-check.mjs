import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { failCheckStatus } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "ready:v2";

const validators = Object.freeze([
  Object.freeze({ name: "ready", script: "tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs" }),
  Object.freeze({ name: "contract", script: "tools/rule-engine-v2/check-contract-manifest-v2.mjs" }),
  Object.freeze({ name: "regression", script: "tools/rule-engine-v2/check-regression-manifest-v2.mjs" }),
]);
const validatorScripts = new Set(validators.map((v) => v.script));
const checks = [...READY_PHASES_V2, ...REGRESSION_CHECKS_V2, ...CONTRACT_CHECKS_V2];

for (const validator of validators) {
  const script = validator.script;
  const res = runCheckScript(script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `validator failed: ${validator.name}`, res.status || 1);
}

for (const entry of checks) {
  if (validatorScripts.has(entry.script)) continue;
  const res = runCheckScript(entry.script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus(CHECK_TAG, `check failed: ${entry.id}`, res.status || 1);
}

reportCheckPass(CHECK_TAG, "cutover health is green");
