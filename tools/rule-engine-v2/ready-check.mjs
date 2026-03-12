import {
  CHECK_MANIFEST_SETS_V2,
  CHECK_MANIFEST_VALIDATORS_V2,
} from "./check-manifests-v2.mjs";
import { runCheckScript } from "./run-check-v2.mjs";

const CHECK_SET_ORDER = Object.freeze(["ready", "regression", "contract"]);
const CHECK_SETS_BY_NAME = Object.freeze(
  Object.fromEntries(CHECK_MANIFEST_SETS_V2.map((set) => [set.name, set.entries]))
);

const readyPhasesManifestCheck = runCheckScript(CHECK_MANIFEST_VALIDATORS_V2.ready, { stdio: "inherit" });
if (!readyPhasesManifestCheck.ok) process.exit(readyPhasesManifestCheck.status);

for (const setName of CHECK_SET_ORDER) {
  const entries = CHECK_SETS_BY_NAME[setName] || [];
  for (const entry of entries) {
    const res = runCheckScript(entry.script, { stdio: "inherit" });
    if (!res.ok) process.exit(res.status);
  }
}

console.log("[ready:v2] PASS: cutover health is green");
