export const MANIFEST_VALIDATORS_V2 = Object.freeze([
  Object.freeze({ name: "ready", script: "tools/rule-engine-v2/check-ready-phases-manifest-v2.mjs" }),
  Object.freeze({ name: "contract", script: "tools/rule-engine-v2/check-contract-manifest-v2.mjs" }),
  Object.freeze({ name: "regression", script: "tools/rule-engine-v2/check-regression-manifest-v2.mjs" }),
]);

export const MANIFEST_VALIDATOR_NAMES_V2 = Object.freeze(
  MANIFEST_VALIDATORS_V2.map((item) => item.name)
);

const MANIFEST_VALIDATOR_SCRIPT_SET_V2 = new Set(
  MANIFEST_VALIDATORS_V2.map((item) => item.script)
);

export function isManifestValidatorScriptV2(script) {
  return MANIFEST_VALIDATOR_SCRIPT_SET_V2.has(script);
}
