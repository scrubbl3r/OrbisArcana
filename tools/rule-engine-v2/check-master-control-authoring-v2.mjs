import {
  buildRuleEngineFromCompiledInteractionGraphV2,
  COMPILED_INTERACTION_GRAPH_V2,
  WORDBOOK_V2_ACTIVE_WORDS_BY_ID,
} from "../../src/content/interactions-v2/index.js";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { asLowerText } from "./text-utils-v2.mjs";

// Validates generated master-control authoring JSON shape and word inventory parity.
const CHECK_TAG = "master-control-authoring:v2";
const PASS_MESSAGE = "authoring artifact integrity verified";

function isRecord(v) {
  return (!!v && typeof v === "object" && !Array.isArray(v)) ? v : null;
}

function main() {
  const doc = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.masterControlAuthoringJson);
  const root = isRecord(doc);
  if (!root) failCheck(CHECK_TAG, "root must be an object");
  const schema = typeof root.schema === "string" ? root.schema : "";
  if (schema !== RULE_ENGINE_V2_SCHEMA_IDS.masterControlAuthoring) {
    failCheck(CHECK_TAG, `unexpected schema: ${schema}`);
  }

  if (typeof root.enabled !== "boolean") {
    failCheck(CHECK_TAG, "enabled must be boolean");
  }
  if (!isRecord(root.defaults)) {
    failCheck(CHECK_TAG, "defaults must be an object");
  }
  if (!Array.isArray(root.rules)) {
    failCheck(CHECK_TAG, "rules must be an array");
  }
  if (!Array.isArray(root.words)) {
    failCheck(CHECK_TAG, "words must be an array");
  }
  const authoringWords = root.words;

  const seenWordIds = new Set();
  for (const s of authoringWords) {
    const word = isRecord(s);
    if (!word) failCheck(CHECK_TAG, "words[] entries must be objects");
    const id = asLowerText(word.id);
    if (!id) failCheck(CHECK_TAG, "words[] entry missing id");
    if (seenWordIds.has(id)) failCheck(CHECK_TAG, `duplicate word id: ${id}`);
    seenWordIds.add(id);
    if (!Object.prototype.hasOwnProperty.call(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, id)) {
      failCheck(CHECK_TAG, `words[] contains inactive/unknown word id: ${id}`);
    }
  }

  const expectedRules = Array.isArray(COMPILED_INTERACTION_GRAPH_V2?.rules) ? COMPILED_INTERACTION_GRAPH_V2.rules : [];
  if (root.rules.length !== expectedRules.length) {
    failCheck(CHECK_TAG, `rules count mismatch: doc=${root.rules.length} expected=${expectedRules.length}`);
  }
  const projectedEngine = buildRuleEngineFromCompiledInteractionGraphV2();
  const projectedRules = Array.isArray(projectedEngine?.rules) ? projectedEngine.rules : [];
  if (!projectedRules.length) {
    failCheck(CHECK_TAG, "orchestrator compiled rules must be present");
  }

  reportCheckPass(CHECK_TAG, PASS_MESSAGE);
}

main();
