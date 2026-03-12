import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";

export const MANIFEST_CHECK_GROUPS_V2 = Object.freeze([
  Object.freeze({ name: "ready", entries: READY_PHASES_V2 }),
  Object.freeze({ name: "regression", entries: REGRESSION_CHECKS_V2 }),
  Object.freeze({ name: "contract", entries: CONTRACT_CHECKS_V2 }),
]);

export function flattenManifestChecksV2(groups = MANIFEST_CHECK_GROUPS_V2) {
  const list = Array.isArray(groups) ? groups : [];
  return list.flatMap((group) => group?.entries || []);
}
