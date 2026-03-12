import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";

export const CHECK_MANIFEST_SETS_V2 = Object.freeze([
  Object.freeze({ name: "ready", entries: READY_PHASES_V2 }),
  Object.freeze({ name: "regression", entries: REGRESSION_CHECKS_V2 }),
  Object.freeze({ name: "contract", entries: CONTRACT_CHECKS_V2 }),
]);

export const ALL_CHECK_MANIFEST_ENTRIES_V2 = Object.freeze(
  CHECK_MANIFEST_SETS_V2.flatMap((set) => set.entries)
);

export const CHECK_MANIFEST_VALIDATORS_V2 = Object.freeze({
  ready: "tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs",
  contract: "tools/rule-engine-v2/check-contract-manifest-v2.mjs",
  regression: "tools/rule-engine-v2/check-regression-manifest-v2.mjs",
});

export function getCheckManifestEntriesV2(name) {
  const target = String(name || "").trim();
  const found = CHECK_MANIFEST_SETS_V2.find((set) => set.name === target);
  return found ? found.entries : [];
}
