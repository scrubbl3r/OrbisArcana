import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";

function fail(msg) {
  console.error(`[cross-manifest-integrity:v2] FAIL: ${msg}`);
  process.exit(1);
}

function collect(manifestName, entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    manifest: manifestName,
    id: String(entry?.id || "").trim(),
    script: String(entry?.script || "").trim(),
  }));
}

const all = [
  ...collect("ready", READY_PHASES_V2),
  ...collect("regression", REGRESSION_CHECKS_V2),
  ...collect("contract", CONTRACT_CHECKS_V2),
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
if (idConflicts.length) fail(`cross-manifest id collisions: ${idConflicts.join(", ")}`);

const scriptConflicts = [];
for (const [script, owners] of scriptOwners.entries()) {
  if (owners.size > 1) scriptConflicts.push(`${script}=>${[...owners].sort().join("+")}`);
}
if (scriptConflicts.length) fail(`cross-manifest script collisions: ${scriptConflicts.join(", ")}`);

console.log("[cross-manifest-integrity:v2] PASS: no cross-manifest id/script collisions");
