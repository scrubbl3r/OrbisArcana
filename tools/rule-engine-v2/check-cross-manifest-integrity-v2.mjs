import { failCheck } from "./check-fail-v2.mjs";
import { flattenNormalizedManifestChecksV2 } from "./manifest-check-entries-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Guards against duplicate IDs/scripts being owned by multiple manifests.
const CHECK_TAG = "cross-manifest-integrity:v2";
const CONFLICT_JOIN_TOKEN = "+";
const ID_COLLISIONS_LABEL = "cross-manifest id collisions";
const SCRIPT_COLLISIONS_LABEL = "cross-manifest script collisions";
const PASS_MESSAGE = "no cross-manifest id/script collisions";

const all = flattenNormalizedManifestChecksV2();

function buildConflictList(ownersByKey) {
  const conflicts = [];
  for (const [key, owners] of ownersByKey.entries()) {
    if (owners.size > 1) conflicts.push(`${key}=>${[...owners].sort().join(CONFLICT_JOIN_TOKEN)}`);
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
if (idConflicts.length) failCheck(CHECK_TAG, `${ID_COLLISIONS_LABEL}: ${idConflicts.join(", ")}`);

const scriptConflicts = buildConflictList(scriptOwners);
if (scriptConflicts.length) failCheck(CHECK_TAG, `${SCRIPT_COLLISIONS_LABEL}: ${scriptConflicts.join(", ")}`);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
