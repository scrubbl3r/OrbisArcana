import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  INTERACTIONS_V2,
  SPELLBOOK_V2,
} from "../../src/content/interactions-v2/index.js";

function toJson(value) {
  return JSON.stringify(value, null, 2);
}

function buildDoc() {
  const generatedAt = new Date().toISOString();
  const spells = Array.isArray(SPELLBOOK_V2 && SPELLBOOK_V2.spells) ? SPELLBOOK_V2.spells : [];
  const rules = Array.isArray(INTERACTIONS_V2 && INTERACTIONS_V2.rules) ? INTERACTIONS_V2.rules : [];
  const defaults = (INTERACTIONS_V2 && INTERACTIONS_V2.defaults && typeof INTERACTIONS_V2.defaults === "object")
    ? INTERACTIONS_V2.defaults
    : {};
  const enabled = !!(INTERACTIONS_V2 && INTERACTIONS_V2.enabled !== false);

  const lines = [];
  lines.push("# OrbisArcana Master Control V2");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push("This document is generated from SSOT:");
  lines.push("- spellbook: `src/content/interactions-v2/spellbook-v2.js`");
  lines.push("- interactions: `src/content/interactions-v2/interactions-v2.js`");
  lines.push("");
  lines.push("## Runtime Flags");
  lines.push("");
  lines.push(`- interactionsEnabled: ${enabled}`);
  lines.push("");
  lines.push("## Spellbook (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({ version: SPELLBOOK_V2 && SPELLBOOK_V2.version, spells }));
  lines.push("```");
  lines.push("");
  lines.push("## Interaction Defaults (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(defaults));
  lines.push("```");
  lines.push("");
  lines.push("## Interaction Rules (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(rules));
  lines.push("```");
  lines.push("");
  lines.push("## Authoring Notes");
  lines.push("");
  lines.push("- Add/remove/toggle spells in `spellbook-v2.js`.");
  lines.push("- Compose trigger/action chains in `interactions-v2.js`.");
  lines.push("- Rule/event/signals compatibility layers are auto-validated in `ready:v2`.");
  lines.push("");
  return lines.join("\n");
}

const outPath = resolve(process.cwd(), "docs/master-control-v2.md");
writeFileSync(outPath, buildDoc(), "utf8");
console.log(`[master-control-doc:v2] wrote ${outPath}`);
