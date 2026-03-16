import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { RULE_ENGINE_V2_LEGACY_HANDLE_TOKENS } from "./handle-naming-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-legacy-handle-drift:v2";

const docFiles = Object.freeze([
  RULE_ENGINE_V2_DOC_PATHS.docsIndex,
  RULE_ENGINE_V2_DOC_PATHS.interactionsSchemaDoc,
  RULE_ENGINE_V2_DOC_PATHS.masterControlSchemaDoc,
  RULE_ENGINE_V2_DOC_PATHS.ruleEngineSmokeDoc,
  RULE_ENGINE_V2_DOC_PATHS.ruleEngineAuthoringDoc,
  RULE_ENGINE_V2_DOC_PATHS.ruleEngineCompatibilityDoc,
]);

for (const rel of docFiles) {
  const text = readRelativeText(rel);
  for (const token of RULE_ENGINE_V2_LEGACY_HANDLE_TOKENS) {
    if (text.includes(token)) {
      failCheck(CHECK_TAG, `${rel} contains legacy token: ${token}`);
    }
  }
}

reportCheckPass(CHECK_TAG, "rule-engine docs are free of legacy handle names");
