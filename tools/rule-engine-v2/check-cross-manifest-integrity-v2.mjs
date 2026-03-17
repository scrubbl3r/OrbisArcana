import { failCheck } from "./check-fail-v2.mjs";
import { flattenNormalizedManifestChecksV2 } from "./manifest-check-entries-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "cross-manifest-integrity:v2";

const all = flattenNormalizedManifestChecksV2();

function buildConflictList(ownersByKey) {
  const conflicts = [];
  for (const [key, owners] of ownersByKey.entries()) {
    if (owners.size > 1) conflicts.push(`${key}=>${[...owners].sort().join("+")}`);
  }
  return conflicts;
}

const idOwners = new Map();
const scriptOwners = new Map();

function ensureOwnerSet(map, key) {
  const existing = map.get(key);
  if (existing) return existing;
  const created = new Set();
  map.set(key, created);
  return created;
}

for (const item of all) {
  const idKey = item.id;
  const scriptKey = item.script;
  if (!idKey || !scriptKey) continue;

  ensureOwnerSet(idOwners, idKey).add(item.manifest);

  ensureOwnerSet(scriptOwners, scriptKey).add(item.manifest);
}

const idConflicts = buildConflictList(idOwners);
if (idConflicts.length) failCheck(CHECK_TAG, `cross-manifest id collisions: ${idConflicts.join(", ")}`);

const scriptConflicts = buildConflictList(scriptOwners);
if (scriptConflicts.length) failCheck(CHECK_TAG, `cross-manifest script collisions: ${scriptConflicts.join(", ")}`);

reportCheckPass(CHECK_TAG, "no cross-manifest id/script collisions");
