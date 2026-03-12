export const MANIFEST_VALIDATORS_V2 = Object.freeze([
  Object.freeze({ name: "ready", script: "tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs" }),
  Object.freeze({ name: "contract", script: "tools/rule-engine-v2/check-contract-manifest-v2.mjs" }),
  Object.freeze({ name: "regression", script: "tools/rule-engine-v2/check-regression-manifest-v2.mjs" }),
]);
