import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";
import { normalizeManifestEntries } from "./manifest-collision-utils-v2.mjs";

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
  return groups;
}

function manifestGroupNameTextV2(groupName) {
  return typeof groupName === "string" ? groupName.trim() : "";
}

export function flattenManifestChecksV2(groups = MANIFEST_CHECK_GROUPS_V2) {
  return asManifestGroupsV2(groups).flatMap((group) =>
    Array.isArray(group?.entries) ? group.entries : []
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
    normalizeManifestEntries(group?.name, group?.entries)
  );
}
