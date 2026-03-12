import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";

export const CHECK_MANIFEST_SETS_V2 = Object.freeze([
  Object.freeze({ name: "ready", entries: READY_PHASES_V2 }),
  Object.freeze({ name: "regression", entries: REGRESSION_CHECKS_V2 }),
  Object.freeze({ name: "contract", entries: CONTRACT_CHECKS_V2 }),
]);

export const CHECK_MANIFEST_SET_ORDER_V2 = Object.freeze(
  CHECK_MANIFEST_SETS_V2.map((set) => set.name)
);

export const CHECK_MANIFEST_SETS_BY_NAME_V2 = Object.freeze(
  Object.fromEntries(CHECK_MANIFEST_SETS_V2.map((set) => [set.name, set.entries]))
);

export const ALL_CHECK_MANIFEST_ENTRIES_V2 = Object.freeze(
  CHECK_MANIFEST_SETS_V2.flatMap((set) => set.entries)
);

export const CHECK_MANIFEST_VALIDATORS_V2 = Object.freeze({
  ready: "tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs",
  contract: "tools/rule-engine-v2/check-contract-manifest-v2.mjs",
  regression: "tools/rule-engine-v2/check-regression-manifest-v2.mjs",
});

export const CHECK_MANIFEST_VALIDATOR_ORDER_V2 = Object.freeze([
  "ready",
  "contract",
  "regression",
]);

export function getCheckManifestEntriesV2(name) {
  const target = String(name || "").trim();
  return CHECK_MANIFEST_SETS_BY_NAME_V2[target] || [];
}

export function getCheckManifestEntriesGroupV2(names) {
  const list = Array.isArray(names) ? names : [];
  return list.flatMap((name) => getCheckManifestEntriesV2(name));
}

export function getCheckManifestValidatorScriptsV2(order = CHECK_MANIFEST_VALIDATOR_ORDER_V2) {
  const names = Array.isArray(order) ? order : [];
  return names
    .map((name) => CHECK_MANIFEST_VALIDATORS_V2[name])
    .filter(Boolean);
}
