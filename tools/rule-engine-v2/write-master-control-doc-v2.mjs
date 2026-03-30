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
  buildRuleEngineFromCompiledInteractionGraphV2,
  INTERACTION_GRAPH_V2,
  EVENT_HANDLES_V2,
  COMPILED_INTERACTION_GRAPH_V2,
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
  const interactionGraph = asObject(INTERACTION_GRAPH_V2);
  const compiledInteractionGraph = asObject(COMPILED_INTERACTION_GRAPH_V2);
  const defaults = asObject(compiledInteractionGraph.defaults);
  const rules = asRules(compiledInteractionGraph.rules);
  const enabled = compiledInteractionGraph.enabled !== false;
  const compiledEngine = buildRuleEngineFromCompiledInteractionGraphV2();
  const compiledRules = asRules(compiledEngine?.rules);

  const lines = [];
  lines.push("# OrbisArcana Master Control V2");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push("This document is generated from SSOT:");
  lines.push("- wordbook: `src/content/interactions-v2/wordbook-v2.js`");
  lines.push("- behavior authoring: `src/content/interactions-v2/interaction-graph-v2.js`");
  lines.push("- compiled interaction graph view: `src/content/interactions-v2/compiled-interaction-graph-v2.js`");
  lines.push("");
  lines.push("## Runtime Flags");
  lines.push("");
  lines.push(`- compiledInteractionGraphEnabled: ${enabled}`);
  lines.push("");
  lines.push("## Wordbook (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({ version: WORDBOOK_V2?.version, words }));
  lines.push("```");
  lines.push("");
  lines.push("## Behavior Authoring (SSOT)");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({
    version: interactionGraph.version,
    enabled: interactionGraph.enabled !== false,
    wake: asObject(interactionGraph.wake),
    groups: asObject(interactionGraph.groups),
    rules: asRules(interactionGraph.rules),
  }));
  lines.push("```");
  lines.push("");
  lines.push("## Compiled Interaction Graph Defaults");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(defaults));
  lines.push("```");
  lines.push("");
  lines.push("## Compiled Interaction Graph Rules");
  lines.push("");
  lines.push("```json");
  lines.push(toJson(rules));
  lines.push("```");
  lines.push("");
  lines.push("## Compiled Interaction Graph Projection");
  lines.push("");
  lines.push("```json");
  lines.push(toJson({
    version: compiledInteractionGraph.version,
    enabled,
    ruleCount: compiledRules.length,
    parityWithCompiledInteractionGraphRuleCount: compiledRules.length === rules.length,
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
  lines.push("- Compose trigger/action chains in `interaction-graph-v2.js`.");
  lines.push("- `compiled-interaction-graph-v2.js` is compiled output used by runtime/builder validation.");
  lines.push("- Runtime rule/event/signal wiring is auto-validated in `ready:v2`.");
  lines.push("");
  return lines.join("\n");
}

function buildMasterControlJson() {
  const compiledInteractionGraph = asObject(COMPILED_INTERACTION_GRAPH_V2);
  const compiledInteractionGraphDefaults = asObject(compiledInteractionGraph.defaults);
  const compiledInteractionGraphRules = asRules(compiledInteractionGraph.rules);
  const compiledInteractionGraphEnabled = compiledInteractionGraph.enabled !== false;
  const compiledEngine = buildRuleEngineFromCompiledInteractionGraphV2();
  const compiledRules = asRules(compiledEngine?.rules);
  return {
    schema: RULE_ENGINE_V2_SCHEMA_IDS.masterControl,
    generatedAt: nowIso(),
    wordbook: {
      version: WORDBOOK_V2?.version,
      words: listWordbookWords(WORDBOOK_V2),
    },
    compiledInteractionGraph: {
      version: compiledInteractionGraph.version,
      enabled: compiledInteractionGraphEnabled,
      defaults: compiledInteractionGraphDefaults,
      rules: compiledInteractionGraphRules,
    },
    interactionGraph: {
      version: INTERACTION_GRAPH_V2?.version,
      enabled: INTERACTION_GRAPH_V2?.enabled !== false,
      wake: INTERACTION_GRAPH_V2?.wake ?? {},
      groups: INTERACTION_GRAPH_V2?.groups ?? {},
      rules: Array.isArray(INTERACTION_GRAPH_V2?.rules) ? INTERACTION_GRAPH_V2.rules : [],
    },
    compiledInteractionGraphProjection: {
      version: compiledInteractionGraph.version,
      enabled: compiledInteractionGraphEnabled,
      ruleCount: compiledRules.length,
      parityWithCompiledInteractionGraphRuleCount: compiledRules.length === compiledInteractionGraphRules.length,
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
  const interactionGraph = asObject(INTERACTION_GRAPH_V2);
  const compiledInteractionGraph = asObject(COMPILED_INTERACTION_GRAPH_V2);
  const defaults = asObject(compiledInteractionGraph.defaults);
  const rules = asRules(compiledInteractionGraph.rules);
  const enabled = compiledInteractionGraph.enabled !== false;

  return {
    schema: RULE_ENGINE_V2_SCHEMA_IDS.masterControlAuthoring,
    generatedAt: nowIso(),
    enabled: interactionGraph.enabled !== false,
    wake: asObject(interactionGraph.wake),
    groups: asObject(interactionGraph.groups),
    defaults: asObject(interactionGraph.defaults),
    words: activeWords,
    rules: asRules(interactionGraph.rules),
    compiled: {
      enabled,
      defaults,
      rules,
    },
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
