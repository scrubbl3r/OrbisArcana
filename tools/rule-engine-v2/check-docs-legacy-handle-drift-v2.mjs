import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-legacy-handle-drift:v2";

const docFiles = Object.freeze([
  RULE_ENGINE_V2_DOC_PATHS.docsIndex,
  RULE_ENGINE_V2_DOC_PATHS.ruleEngineAuthoringDoc,
  RULE_ENGINE_V2_DOC_PATHS.ruleEngineCompatibilityDoc,
]);

const forbiddenTokens = Object.freeze([
  "Y_SPIN",
  "FSPIN_X",
  "FSPIN_Y",
  "FSPIN_Z",
  "FB_SHAKE",
  "LR_SHAKE",
  "UD_SHAKE",
  "DOMUS_TELEPORT",
  "FLAME_AOE",
  "FROST_AOE",
  "ELECTRIC_AOE",
]);

for (const rel of docFiles) {
  const text = readRelativeText(rel);
  for (const token of forbiddenTokens) {
    if (text.includes(token)) {
      failCheck(CHECK_TAG, `${rel} contains legacy token: ${token}`);
    }
  }
}

reportCheckPass(CHECK_TAG, "rule-engine docs are free of legacy handle names");
