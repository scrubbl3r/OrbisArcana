import { failCheck } from "./check-fail-v2.mjs";
import { normalizeManifestEntries } from "./manifest-collision-utils-v2.mjs";
import { CHECK_MANIFEST_SETS_V2 } from "./check-manifests-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "cross-manifest-integrity:v2";

const all = CHECK_MANIFEST_SETS_V2.flatMap((set) =>
  normalizeManifestEntries(set.name, set.entries)
);

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
if (idConflicts.length) failCheck(CHECK_TAG, `cross-manifest id collisions: ${idConflicts.join(", ")}`);

const scriptConflicts = [];
for (const [script, owners] of scriptOwners.entries()) {
  if (owners.size > 1) scriptConflicts.push(`${script}=>${[...owners].sort().join("+")}`);
}
if (scriptConflicts.length) failCheck(CHECK_TAG, `cross-manifest script collisions: ${scriptConflicts.join(", ")}`);

reportCheckPass(CHECK_TAG, "no cross-manifest id/script collisions");
