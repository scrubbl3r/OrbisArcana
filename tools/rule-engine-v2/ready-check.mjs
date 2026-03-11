import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";

const readyPhasesManifestCheck = runCheckScript("tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs", { stdio: "inherit" });
if (!readyPhasesManifestCheck.ok) process.exit(readyPhasesManifestCheck.status);

for (const phase of READY_PHASES_V2) {
  const res = runCheckScript(phase.script, { stdio: "inherit" });
  if (!res.ok) process.exit(res.status);
}

for (const check of REGRESSION_CHECKS_V2) {
  const res = runCheckScript(check.script, { stdio: "inherit" });
  if (!res.ok) process.exit(res.status);
}

for (const check of CONTRACT_CHECKS_V2) {
  const res = runCheckScript(check.script, { stdio: "inherit" });
  if (!res.ok) process.exit(res.status);
}

console.log("[ready:v2] PASS: cutover health is green");
