import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { normalizeManifestEntries } from "./manifest-collision-utils-v2.mjs";

const all = [
  ...normalizeManifestEntries("ready", READY_PHASES_V2),
  ...normalizeManifestEntries("regression", REGRESSION_CHECKS_V2),
  ...normalizeManifestEntries("contract", CONTRACT_CHECKS_V2),
];

const idOwners = new Map();
const scriptOwners = new Map();

for (const item of all) {
  const idKey = item.id;
  const scriptKey = item.script;
  if (!idKey || !scriptKey) continue;

  if (!idOwners.has(idKey)) idOwners.set(idKey, new Set());
  idOwners.get(idKey).add(item.manifest);

  if (!scriptOwners.has(scriptKey)) scriptOwners.set(scriptKey, new Set());
  scriptOwners.get(scriptKey).add(item.manifest);
}

const idConflicts = [];
for (const [id, owners] of idOwners.entries()) {
  if (owners.size > 1) idConflicts.push(`${id}=>${[...owners].sort().join("+")}`);
}
if (idConflicts.length) failCheck("cross-manifest-integrity:v2", `cross-manifest id collisions: ${idConflicts.join(", ")}`);

const scriptConflicts = [];
for (const [script, owners] of scriptOwners.entries()) {
  if (owners.size > 1) scriptConflicts.push(`${script}=>${[...owners].sort().join("+")}`);
}
if (scriptConflicts.length) failCheck("cross-manifest-integrity:v2", `cross-manifest script collisions: ${scriptConflicts.join(", ")}`);

console.log("[cross-manifest-integrity:v2] PASS: no cross-manifest id/script collisions");
