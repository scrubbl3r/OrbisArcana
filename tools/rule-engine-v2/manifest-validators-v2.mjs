import { defineCheckEntriesV2 } from "./define-check-entries-v2.mjs";

export const MANIFEST_VALIDATORS_V2 = defineCheckEntriesV2([
  { name: "ready", script: "tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs" },
  { name: "contract", script: "tools/rule-engine-v2/check-contract-manifest-v2.mjs" },
  { name: "regression", script: "tools/rule-engine-v2/check-regression-manifest-v2.mjs" },
]);

const MANIFEST_VALIDATOR_SCRIPT_SET_V2 = new Set(
  MANIFEST_VALIDATORS_V2.map((item) => item.script)
);

export function isManifestValidatorScriptV2(script) {
  return MANIFEST_VALIDATOR_SCRIPT_SET_V2.has(script);
}
