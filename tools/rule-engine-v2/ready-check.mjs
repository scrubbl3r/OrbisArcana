import {
  CHECK_MANIFEST_SETS_BY_NAME_V2,
  CHECK_MANIFEST_SET_ORDER_V2,
  CHECK_MANIFEST_VALIDATOR_ORDER_V2,
  CHECK_MANIFEST_VALIDATORS_V2,
} from "./check-manifests-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";
import { failCheckStatus } from "./check-fail-v2.mjs";

const validatorScripts = new Set(
  CHECK_MANIFEST_VALIDATOR_ORDER_V2
    .map((name) => CHECK_MANIFEST_VALIDATORS_V2[name])
    .filter(Boolean)
);

for (const validatorName of CHECK_MANIFEST_VALIDATOR_ORDER_V2) {
  const script = CHECK_MANIFEST_VALIDATORS_V2[validatorName];
  if (!script) continue;
  const res = runCheckScript(script, { stdio: "inherit" });
  if (!res.ok) failCheckStatus("ready:v2", `validator failed: ${validatorName}`, res.status || 1);
}

for (const setName of CHECK_MANIFEST_SET_ORDER_V2) {
  const entries = CHECK_MANIFEST_SETS_BY_NAME_V2[setName] || [];
  for (const entry of entries) {
    if (validatorScripts.has(entry.script)) continue;
    const res = runCheckScript(entry.script, { stdio: "inherit" });
    if (!res.ok) failCheckStatus("ready:v2", `check failed: ${entry.id}`, res.status || 1);
  }
}

console.log("[ready:v2] PASS: cutover health is green");
