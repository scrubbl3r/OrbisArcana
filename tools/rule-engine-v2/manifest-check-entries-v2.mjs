// Manifest-group composition and flattening helpers for ready/regression/contract sets.
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { normalizeManifestEntries } from "./manifest-collision-utils-v2.mjs";
// Provides canonical grouped/flattened views for manifest integrity and collision checks.
// Group order is deliberate and reused by readiness orchestration.
export const MANIFEST_CHECK_GROUP_NAMES_V2 = Object.freeze({
  ready: "ready",
  regression: "regression",
  contract: "contract",
});

export const MANIFEST_CHECK_GROUPS_V2 = Object.freeze([
  Object.freeze({ name: MANIFEST_CHECK_GROUP_NAMES_V2.ready, entries: READY_PHASES_V2 }),
  Object.freeze({ name: MANIFEST_CHECK_GROUP_NAMES_V2.regression, entries: REGRESSION_CHECKS_V2 }),
  Object.freeze({ name: MANIFEST_CHECK_GROUP_NAMES_V2.contract, entries: CONTRACT_CHECKS_V2 }),
]);

function asManifestGroupsV2(groups = MANIFEST_CHECK_GROUPS_V2) {
  if (!Array.isArray(groups)) {
    throw new Error("manifest check groups must be an array");
  }
  return groups.map((group, index) => {
    if (!group || typeof group !== "object") {
      throw new Error(`manifest check group[${index}] must be an object`);
    }
    const name = manifestGroupNameTextV2(group.name);
    if (!name) {
      throw new Error(`manifest check group[${index}] requires non-empty name`);
    }
    if (!Array.isArray(group.entries)) {
      throw new Error(`manifest check group[${index}] '${name}' entries must be an array`);
    }
    return group;
  });
}

function manifestGroupNameTextV2(groupName) {
  return typeof groupName === "string" ? groupName.trim() : "";
}

export function flattenManifestChecksV2(groups = MANIFEST_CHECK_GROUPS_V2) {
  return asManifestGroupsV2(groups).flatMap((group) =>
    group.entries.map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        throw new Error(`manifest check entry[${group.name}][${index}] must be an object`);
      }
      const id = typeof entry.id === "string" ? entry.id.trim() : "";
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      if (!id && !name) {
        throw new Error(`manifest check entry[${group.name}][${index}] requires non-empty id or name`);
      }
      const script = typeof entry.script === "string" ? entry.script.trim() : "";
      if (!script) {
        throw new Error(`manifest check entry[${group.name}][${index}] requires non-empty script`);
      }
      return entry;
    })
  );
}

export function flattenManifestChecksExcludingV2(excludedGroupName, groups = MANIFEST_CHECK_GROUPS_V2) {
  const excluded = manifestGroupNameTextV2(excludedGroupName);
  return flattenManifestChecksV2(
    asManifestGroupsV2(groups).filter((group) => manifestGroupNameTextV2(group?.name) !== excluded)
  );
}

export function flattenNormalizedManifestChecksV2(groups = MANIFEST_CHECK_GROUPS_V2) {
  return asManifestGroupsV2(groups).flatMap((group) =>
    normalizeManifestEntries(group.name, group.entries)
  );
}
