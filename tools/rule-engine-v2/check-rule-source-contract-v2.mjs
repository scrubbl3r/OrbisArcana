import {
  RULE_ENGINE_SOURCES,
  RULE_ENGINE_SOURCE_READOUT,
} from "../../src/runtime/receiver-bootstrap.js";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "rule-source-contract:v2";

const expectedSourceIds = Object.freeze([
  "orchestrator_v1",
  "orchestrator_v1_projected",
  "orchestrator_v1_fallback",
  "orchestrator_v1_disabled",
  "orchestrator_v1_missing_builder",
  "interactions_adapter",
  "interactions_adapter_fallback",
  "interactions_bootstrap_disabled",
  "interactions_adapter_missing_builder",
]);

function isObjectRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

if (!isObjectRecord(RULE_ENGINE_SOURCES)) {
  failCheck(CHECK_TAG, "RULE_ENGINE_SOURCES export missing");
}
if (!isObjectRecord(RULE_ENGINE_SOURCE_READOUT)) {
  failCheck(CHECK_TAG, "RULE_ENGINE_SOURCE_READOUT export missing");
}

const sourceValues = Object.values(RULE_ENGINE_SOURCES);
const sourceValueSet = new Set(sourceValues);
for (const id of expectedSourceIds) {
  if (!sourceValueSet.has(id)) {
    failCheck(CHECK_TAG, `missing source id: ${id}`);
  }
}

for (const id of expectedSourceIds) {
  if (typeof RULE_ENGINE_SOURCE_READOUT[id] !== "string" || RULE_ENGINE_SOURCE_READOUT[id].trim() === "") {
    failCheck(CHECK_TAG, `missing readout label for source id: ${id}`);
  }
}

const deprecatedIds = Object.freeze([
  "legacy_policy_fallback",
]);
for (const id of deprecatedIds) {
  if (sourceValueSet.has(id)) failCheck(CHECK_TAG, `deprecated source id present in RULE_ENGINE_SOURCES: ${id}`);
  if (Object.prototype.hasOwnProperty.call(RULE_ENGINE_SOURCE_READOUT, id)) {
    failCheck(CHECK_TAG, `deprecated source id present in RULE_ENGINE_SOURCE_READOUT: ${id}`);
  }
}

reportCheckPass(CHECK_TAG, "runtime source ids/readouts are canonical");
