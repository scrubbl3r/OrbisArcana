import {
  INTERACTIONS_V2,
  SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID,
} from "../../src/content/interactions-v2/index.js";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { getInteractionsRules } from "./interactions-v2-utils.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { asLowerText } from "./text-utils-v2.mjs";

const CHECK_TAG = "master-control-authoring:v2";

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : null;
}

function main() {
  const doc = readJsonOrFail(CHECK_TAG, RULE_ENGINE_V2_DOC_PATHS.masterControlAuthoringJson);
  const root = asObj(doc);
  if (!root) failCheck(CHECK_TAG, "root must be an object");
  const schema = typeof root.schema === "string" ? root.schema : "";
  if (schema !== RULE_ENGINE_V2_SCHEMA_IDS.masterControlAuthoring) {
    failCheck(CHECK_TAG, `unexpected schema: ${schema}`);
  }

  if (typeof root.enabled !== "boolean") {
    failCheck(CHECK_TAG, "enabled must be boolean");
  }
  if (!asObj(root.defaults)) {
    failCheck(CHECK_TAG, "defaults must be an object");
  }
  if (!Array.isArray(root.rules)) {
    failCheck(CHECK_TAG, "rules must be an array");
  }
  if (!Array.isArray(root.spells)) {
    failCheck(CHECK_TAG, "spells must be an array");
  }

  const seenSpellIds = new Set();
  for (const s of root.spells) {
    const spell = asObj(s);
    if (!spell) failCheck(CHECK_TAG, "spells[] entries must be objects");
    const id = asLowerText(spell.id);
    if (!id) failCheck(CHECK_TAG, "spells[] entry missing id");
    if (seenSpellIds.has(id)) failCheck(CHECK_TAG, `duplicate spell id: ${id}`);
    seenSpellIds.add(id);
    if (!Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id)) {
      failCheck(CHECK_TAG, `spells[] contains inactive/unknown spell id: ${id}`);
    }
  }

  const expectedRules = getInteractionsRules(INTERACTIONS_V2);
  if (root.rules.length !== expectedRules.length) {
    failCheck(CHECK_TAG, `rules count mismatch: doc=${root.rules.length} expected=${expectedRules.length}`);
  }

  reportCheckPass(CHECK_TAG, "authoring artifact integrity verified");
}

main();
