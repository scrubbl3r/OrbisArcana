import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";

export const ALL_CHECK_MANIFEST_ENTRIES_V2 = Object.freeze(
  [...READY_PHASES_V2, ...REGRESSION_CHECKS_V2, ...CONTRACT_CHECKS_V2]
);

export const CHECK_MANIFEST_VALIDATORS_V2 = Object.freeze({
  ready: "tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs",
  contract: "tools/rule-engine-v2/check-contract-manifest-v2.mjs",
  regression: "tools/rule-engine-v2/check-regression-manifest-v2.mjs",
});

export function getCheckManifestValidatorsByOrderV2(order = Object.keys(CHECK_MANIFEST_VALIDATORS_V2)) {
  const names = Array.isArray(order) ? order : [];
  return names
    .map((name) => ({
      name,
      script: CHECK_MANIFEST_VALIDATORS_V2[name],
    }))
    .filter((item) => Boolean(item.script));
}
