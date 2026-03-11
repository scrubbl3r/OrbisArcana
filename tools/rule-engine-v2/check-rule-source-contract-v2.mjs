import {
  RULE_ENGINE_SOURCES,
  RULE_ENGINE_SOURCE_READOUT,
} from "../../src/runtime/receiver-bootstrap.js";

function fail(msg) {
  console.error(`[rule-source-contract:v2] FAIL: ${msg}`);
  process.exit(1);
}

const expectedSourceIds = Object.freeze([
  "interactions_adapter",
  "interactions_adapter_fallback",
  "interactions_bootstrap_disabled",
  "interactions_adapter_missing_builder",
]);

if (!RULE_ENGINE_SOURCES || typeof RULE_ENGINE_SOURCES !== "object") {
  fail("RULE_ENGINE_SOURCES export missing");
}
if (!RULE_ENGINE_SOURCE_READOUT || typeof RULE_ENGINE_SOURCE_READOUT !== "object") {
  fail("RULE_ENGINE_SOURCE_READOUT export missing");
}

const sourceValues = Object.values(RULE_ENGINE_SOURCES);
for (const id of expectedSourceIds) {
  if (!sourceValues.includes(id)) {
    fail(`missing source id: ${id}`);
  }
}

for (const id of expectedSourceIds) {
  if (typeof RULE_ENGINE_SOURCE_READOUT[id] !== "string" || RULE_ENGINE_SOURCE_READOUT[id].trim() === "") {
    fail(`missing readout label for source id: ${id}`);
  }
}

const deprecatedIds = Object.freeze([
  "legacy_policy_fallback",
]);
for (const id of deprecatedIds) {
  if (sourceValues.includes(id)) fail(`deprecated source id present in RULE_ENGINE_SOURCES: ${id}`);
  if (Object.prototype.hasOwnProperty.call(RULE_ENGINE_SOURCE_READOUT, id)) {
    fail(`deprecated source id present in RULE_ENGINE_SOURCE_READOUT: ${id}`);
  }
}

console.log("[rule-source-contract:v2] PASS: runtime source ids/readouts are canonical");
