import { writeFileSync } from "node:fs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { nowIso } from "./now-iso-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { stringifyJson } from "./stringify-json-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";
import {
  getInteractionsDefaults,
  getInteractionsRules,
  isInteractionsEnabled,
} from "./interactions-v2-utils.mjs";
import {
  listActiveWordAuthoringRows,
  listWordbookWords,
} from "./wordbook-v2-utils.mjs";
import {
  ACTION_HANDLES_V2,
  EVENT_HANDLES_V2,
  INTERACTIONS_V2,
  projectOrchestratorV1FromInteractionsV2,
  SIGNAL_HANDLES_V2,
  WORDBOOK_V2,
} from "../../src/content/interactions-v2/index.js";

const CHECK_TAG = "master-control-doc:v2";
const logMasterControlDoc = createTaggedLogger(CHECK_TAG);

function toJson(value) {
  return stringifyJson(value);
}

function buildDoc() {
  const generatedAt = nowIso();
  const words = listWordbookWords(WORDBOOK_V2);
  const rules = getInteractionsRules(INTERACTIONS_V2);
  const defaults = getInteractionsDefaults(INTERACTIONS_V2);
  const enabled = isInteractionsEnabled(INTERACTIONS_V2);
  const orchestratorProjection = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
  const orchestratorProjectionRules = Array.isArray(orchestratorProjection?.rules)
    ? orchestratorProjection.rules
    : [];

  const lines = [];
  lines.push("# OrbisArcana Master Control V2");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push("This document is generated from SSOT:");
  lines.push("- wordbook: `src/content/interactions-v2/wordbook-v2.js`");
  lines.push("  - compatibility alias: `src/content/interactions-v2/spellbook-v2.js`");
  lines.push("- interactions: `src/content/interactions-v2/interactions-v2.js`");
  lines.push("");
  lines.push("## Runtime Flags");
  lines.push("");
  lines.push(`- interactionsEnabled: ${enabled}`);
  lines.push("");
  lines.push("## Wordbook (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({ version: WORDBOOK_V2?.version, words }));
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
  lines.push("## Orchestrator Projection (Derived)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({
    version: orchestratorProjection?.version,
    enabled: orchestratorProjection?.enabled !== false,
    ruleCount: orchestratorProjectionRules.length,
    parityWithInteractionsRuleCount: orchestratorProjectionRules.length === rules.length,
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
  lines.push("- Compose trigger/action chains in `interactions-v2.js`.");
  lines.push("- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.");
  lines.push("");
  return lines.join("\n");
}

function buildMasterControlJson() {
  const orchestratorProjection = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
  const interactionsRules = getInteractionsRules(INTERACTIONS_V2);
  const orchestratorProjectionRules = Array.isArray(orchestratorProjection?.rules)
    ? orchestratorProjection.rules
    : [];
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
    interactions: {
      version: INTERACTIONS_V2?.version,
      enabled: isInteractionsEnabled(INTERACTIONS_V2),
      defaults: getInteractionsDefaults(INTERACTIONS_V2),
      rules: interactionsRules,
    },
    orchestratorProjection: {
      version: orchestratorProjection?.version,
      enabled: orchestratorProjection?.enabled !== false,
      ruleCount: orchestratorProjectionRules.length,
      parityWithInteractionsRuleCount: orchestratorProjectionRules.length === interactionsRules.length,
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
  const defaults = getInteractionsDefaults(INTERACTIONS_V2);
  const rules = getInteractionsRules(INTERACTIONS_V2);

  return {
    schema: RULE_ENGINE_V2_SCHEMA_IDS.masterControlAuthoring,
    generatedAt: nowIso(),
    enabled: isInteractionsEnabled(INTERACTIONS_V2),
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
