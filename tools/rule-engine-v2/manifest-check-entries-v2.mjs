import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";

export const NON_READY_MANIFEST_CHECKS_V2 = Object.freeze([
  ...REGRESSION_CHECKS_V2,
  ...CONTRACT_CHECKS_V2,
]);

export const ALL_MANIFEST_CHECKS_V2 = Object.freeze([
  ...READY_PHASES_V2,
  ...NON_READY_MANIFEST_CHECKS_V2,
]);
