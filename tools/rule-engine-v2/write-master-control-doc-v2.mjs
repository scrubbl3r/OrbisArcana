import { writeFileSync } from "node:fs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { stringifyJson } from "./stringify-json-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import {
  ACTION_HANDLES_V2,
  EVENT_HANDLES_V2,
  INTERACTIONS_V2,
  SIGNAL_HANDLES_V2,
  SPELLBOOK_V2,
} from "../../src/content/interactions-v2/index.js";

function toJson(value) {
  return stringifyJson(value);
}

function buildDoc() {
  const generatedAt = nowIso();
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
  lines.push("## Canonical Handles (Nuggets)");
  lines.push("");
  lines.push("### Signals");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(SIGNAL_HANDLES_V2));
  lines.push("```");
  lines.push("");
  lines.push("### Actions");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(ACTION_HANDLES_V2));
  lines.push("```");
  lines.push("");
  lines.push("### Events");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(EVENT_HANDLES_V2));
  lines.push("```");
  lines.push("");
  lines.push("## Authoring Notes");
  lines.push("");
  lines.push("- Add/remove/toggle spells in `spellbook-v2.js`.");
  lines.push("- Compose trigger/action chains in `interactions-v2.js`.");
  lines.push("- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.");
  lines.push("");
  return lines.join("\n");
}

function buildMasterControlJson() {
  return {
    schema: "orbis.master_control_v2",
    generatedAt: nowIso(),
    spellbook: {
      version: SPELLBOOK_V2 && SPELLBOOK_V2.version,
      spells: Array.isArray(SPELLBOOK_V2 && SPELLBOOK_V2.spells) ? SPELLBOOK_V2.spells : [],
    },
    interactions: {
      version: INTERACTIONS_V2 && INTERACTIONS_V2.version,
      enabled: !!(INTERACTIONS_V2 && INTERACTIONS_V2.enabled !== false),
      defaults: (INTERACTIONS_V2 && INTERACTIONS_V2.defaults && typeof INTERACTIONS_V2.defaults === "object")
        ? INTERACTIONS_V2.defaults
        : {},
      rules: Array.isArray(INTERACTIONS_V2 && INTERACTIONS_V2.rules) ? INTERACTIONS_V2.rules : [],
    },
    handles: {
      signals: SIGNAL_HANDLES_V2,
      actions: ACTION_HANDLES_V2,
      events: EVENT_HANDLES_V2,
    },
  };
}

function buildMasterControlAuthoringJson() {
  const spells = Array.isArray(SPELLBOOK_V2 && SPELLBOOK_V2.spells) ? SPELLBOOK_V2.spells : [];
  const activeSpells = spells
    .filter((s) => s && s.active !== false)
    .map((s) => ({
      id: String(s.id || "").trim().toLowerCase(),
      phrase: String(s.phrase || "").trim().toLowerCase(),
      onnx: String(s.onnx || "").trim().toLowerCase(),
      confidence: Number.isFinite(Number(s.confidence)) ? Number(s.confidence) : 0.6,
      cooldownMs: Number.isFinite(Number(s.cooldownMs)) ? Number(s.cooldownMs) : 0,
    }));
  const defaults = (INTERACTIONS_V2 && INTERACTIONS_V2.defaults && typeof INTERACTIONS_V2.defaults === "object")
    ? INTERACTIONS_V2.defaults
    : {};
  const rules = Array.isArray(INTERACTIONS_V2 && INTERACTIONS_V2.rules)
    ? INTERACTIONS_V2.rules
    : [];

  return {
    schema: "orbis.master_control_v2.authoring",
    generatedAt: nowIso(),
    enabled: !!(INTERACTIONS_V2 && INTERACTIONS_V2.enabled !== false),
    defaults,
    spells: activeSpells,
    rules,
  };
}

const outPath = resolveRuleEngineDocPath("masterControlMarkdown");
writeFileSync(outPath, buildDoc(), "utf8");
console.log(`[master-control-doc:v2] wrote ${outPath}`);
const outJsonPath = resolveRuleEngineDocPath("masterControlJson");
writeJsonFile(outJsonPath, buildMasterControlJson());
console.log(`[master-control-doc:v2] wrote ${outJsonPath}`);
const outAuthoringJsonPath = resolveRuleEngineDocPath("masterControlAuthoringJson");
writeJsonFile(outAuthoringJsonPath, buildMasterControlAuthoringJson());
console.log(`[master-control-doc:v2] wrote ${outAuthoringJsonPath}`);
