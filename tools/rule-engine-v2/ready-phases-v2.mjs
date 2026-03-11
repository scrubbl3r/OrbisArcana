export const READY_PHASES_V2 = Object.freeze([
  Object.freeze({
    id: "doctor",
    script: "tools/rule-engine-v2/doctor-v2.mjs",
  }),
  Object.freeze({
    id: "regression_manifest",
    script: "tools/rule-engine-v2/check-regression-manifest-v2.mjs",
  }),
  Object.freeze({
    id: "contract_manifest",
    script: "tools/rule-engine-v2/check-contract-manifest-v2.mjs",
  }),
  Object.freeze({
    id: "master_control_authoring",
    script: "tools/rule-engine-v2/check-master-control-authoring-v2.mjs",
  }),
]);
