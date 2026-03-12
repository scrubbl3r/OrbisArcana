import { defineCheckEntriesV2 } from "./define-check-entries-v2.mjs";

export const READY_PHASES_V2 = defineCheckEntriesV2([
  {
    id: "doctor",
    script: "tools/rule-engine-v2/doctor-v2.mjs",
  },
  {
    id: "regression_manifest",
    script: "tools/rule-engine-v2/check-regression-manifest-v2.mjs",
  },
  {
    id: "contract_manifest",
    script: "tools/rule-engine-v2/check-contract-manifest-v2.mjs",
  },
  {
    id: "master_control_authoring",
    script: "tools/rule-engine-v2/check-master-control-authoring-v2.mjs",
  },
]);
