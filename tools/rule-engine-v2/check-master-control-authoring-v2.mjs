import {
  INTERACTIONS_V2,
  SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID,
} from "../../src/content/interactions-v2/index.js";
import { failCheck } from "./check-fail-v2.mjs";
import { readJsonOrFail } from "./check-json-v2.mjs";

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : null;
}

function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function main() {
  const doc = readJsonOrFail("master-control-authoring:v2", "docs/master-control-v2.authoring.json");
  const root = asObj(doc);
  if (!root) failCheck("master-control-authoring:v2", "root must be an object");
  if (String(root.schema || "") !== "orbis.master_control_v2.authoring") {
    failCheck("master-control-authoring:v2", `unexpected schema: ${String(root.schema || "")}`);
  }

  if (typeof root.enabled !== "boolean") {
    failCheck("master-control-authoring:v2", "enabled must be boolean");
  }
  if (!asObj(root.defaults)) {
    failCheck("master-control-authoring:v2", "defaults must be an object");
  }
  if (!Array.isArray(root.rules)) {
    failCheck("master-control-authoring:v2", "rules must be an array");
  }
  if (!Array.isArray(root.spells)) {
    failCheck("master-control-authoring:v2", "spells must be an array");
  }

  const seenSpellIds = new Set();
  for (const s of root.spells) {
    const spell = asObj(s);
    if (!spell) failCheck("master-control-authoring:v2", "spells[] entries must be objects");
    const id = asId(spell.id);
    if (!id) failCheck("master-control-authoring:v2", "spells[] entry missing id");
    if (seenSpellIds.has(id)) failCheck("master-control-authoring:v2", `duplicate spell id: ${id}`);
    seenSpellIds.add(id);
    if (!Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id)) {
      failCheck("master-control-authoring:v2", `spells[] contains inactive/unknown spell id: ${id}`);
    }
  }

  const expectedRules = Array.isArray(INTERACTIONS_V2 && INTERACTIONS_V2.rules) ? INTERACTIONS_V2.rules : [];
  if (root.rules.length !== expectedRules.length) {
    failCheck("master-control-authoring:v2", `rules count mismatch: doc=${root.rules.length} expected=${expectedRules.length}`);
  }

  console.log("[master-control-authoring:v2] PASS: authoring artifact integrity verified");
}

main();
