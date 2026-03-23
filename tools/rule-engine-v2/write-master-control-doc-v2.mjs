// Generates master-control markdown/json authoring artifacts from SSOT content.
import { writeFileSync } from "node:fs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { stringifyJson } from "./stringify-json-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";
import {
  listActiveWordAuthoringRows,
  listWordbookWords,
} from "./wordbook-v2-utils.mjs";
import {
  ACTION_HANDLES_V2,
  buildRuleEngineFromOrchestratorV1,
  EVENT_HANDLES_V2,
  ORCHESTRATOR_V1,
  SIGNAL_HANDLES_V2,
  WORDBOOK_V2,
} from "../../src/content/interactions-v2/index.js";

const CHECK_TAG = "master-control-doc:v2";
const logMasterControlDoc = createTaggedLogger(CHECK_TAG);

// Generates synchronized markdown/json authoring views from SSOT + projection artifacts.
function toJson(value) {
  return stringifyJson(value);
}

function asObject(value) {
  return (value && typeof value === "object" && !Array.isArray(value)) ? value : Object.create(null);
}

function asRules(value) {
  return Array.isArray(value) ? value : [];
}

function buildDoc() {
  const generatedAt = nowIso();
  const words = listWordbookWords(WORDBOOK_V2);
  const orchestrator = asObject(ORCHESTRATOR_V1);
  const defaults = asObject(orchestrator.defaults);
  const rules = asRules(orchestrator.rules);
  const enabled = orchestrator.enabled !== false;
  const compiledEngine = buildRuleEngineFromOrchestratorV1();
  const compiledRules = asRules(compiledEngine?.rules);

  const lines = [];
  lines.push("# OrbisArcana Master Control V2");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push("This document is generated from SSOT:");
  lines.push("- wordbook: `src/content/interactions-v2/wordbook-v2.js`");
  lines.push("  - compatibility alias: `src/content/interactions-v2/spellbook-v2.js`");
  lines.push("- orchestrator: `src/content/interactions-v2/orchestrator-v1.js`");
  lines.push("");
  lines.push("## Runtime Flags");
  lines.push("");
  lines.push(`- orchestratorEnabled: ${enabled}`);
  lines.push("");
  lines.push("## Wordbook (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({ version: WORDBOOK_V2?.version, words }));
  lines.push("```");
  lines.push("");
  lines.push("## Orchestrator Defaults (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(defaults));
  lines.push("```");
  lines.push("");
  lines.push("## Orchestrator Rules (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(rules));
  lines.push("```");
  lines.push("");
  lines.push("## Orchestrator Projection (Derived)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({
    version: orchestrator.version,
    enabled,
    ruleCount: compiledRules.length,
    parityWithOrchestratorRuleCount: compiledRules.length === rules.length,
  }));
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
  lines.push("- Add/remove/toggle words in `wordbook-v2.js`.");
  lines.push("  - compatibility alias path: `spellbook-v2.js`");
  lines.push("- Compose trigger/action chains in `orchestrator-v1.js`.");
  lines.push("- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.");
  lines.push("");
  return lines.join("\n");
}

function buildMasterControlJson() {
  const orchestrator = asObject(ORCHESTRATOR_V1);
  const orchestratorDefaults = asObject(orchestrator.defaults);
  const orchestratorRules = asRules(orchestrator.rules);
  const orchestratorEnabled = orchestrator.enabled !== false;
  const compiledEngine = buildRuleEngineFromOrchestratorV1();
  const compiledRules = asRules(compiledEngine?.rules);
  return {
    schema: RULE_ENGINE_V2_SCHEMA_IDS.masterControl,
    generatedAt: nowIso(),
    wordbook: {
      version: WORDBOOK_V2?.version,
      words: listWordbookWords(WORDBOOK_V2),
    },
    spellbook: {
      version: WORDBOOK_V2?.version,
      spells: listWordbookWords(WORDBOOK_V2),
    },
    orchestrator: {
      version: orchestrator.version,
      enabled: orchestratorEnabled,
      defaults: orchestratorDefaults,
      rules: orchestratorRules,
    },
    interactions: {
      version: orchestrator.version,
      enabled: orchestratorEnabled,
      defaults: orchestratorDefaults,
      rules: orchestratorRules,
    },
    orchestratorProjection: {
      version: orchestrator.version,
      enabled: orchestratorEnabled,
      ruleCount: compiledRules.length,
      parityWithOrchestratorRuleCount: compiledRules.length === orchestratorRules.length,
    },
    handles: {
      signals: SIGNAL_HANDLES_V2,
      actions: ACTION_HANDLES_V2,
      events: EVENT_HANDLES_V2,
    },
  };
}

function buildMasterControlAuthoringJson() {
  const activeWords = listActiveWordAuthoringRows(WORDBOOK_V2);
  const orchestrator = asObject(ORCHESTRATOR_V1);
  const defaults = asObject(orchestrator.defaults);
  const rules = asRules(orchestrator.rules);
  const enabled = orchestrator.enabled !== false;

  return {
    schema: RULE_ENGINE_V2_SCHEMA_IDS.masterControlAuthoring,
    generatedAt: nowIso(),
    enabled,
    defaults,
    words: activeWords,
    spells: activeWords,
    rules,
  };
}

const outPath = resolveRuleEngineDocPath("masterControlMarkdown");
writeFileSync(outPath, buildDoc(), "utf8");
logMasterControlDoc(`wrote ${outPath}`);
const outJsonPath = resolveRuleEngineDocPath("masterControlJson");
writeJsonFile(outJsonPath, buildMasterControlJson());
logMasterControlDoc(`wrote ${outJsonPath}`);
const outAuthoringJsonPath = resolveRuleEngineDocPath("masterControlAuthoringJson");
writeJsonFile(outAuthoringJsonPath, buildMasterControlAuthoringJson());
logMasterControlDoc(`wrote ${outAuthoringJsonPath}`);
