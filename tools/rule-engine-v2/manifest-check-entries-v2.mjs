import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";
import { CONTRACT_CHECKS_V2 } from "./contract-checks-v2.mjs";

export const ALL_MANIFEST_CHECKS_V2 = Object.freeze([
  ...READY_PHASES_V2,
  ...REGRESSION_CHECKS_V2,
  ...CONTRACT_CHECKS_V2,
]);
