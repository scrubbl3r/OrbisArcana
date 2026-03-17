import { resolve } from "node:path";

export const RULE_ENGINE_V2_DOC_PATHS = Object.freeze({
  docsIndex: "docs/rule-engine-v2-docs-index.md",
  interactionsSchemaDoc: "docs/interactions-schema.md",
  ruleEngineSmokeDoc: "docs/rule-engine-smoke.md",
  ruleEngineAuthoringDoc: "docs/rule-engine-authoring.md",
  ruleEngineCompatibilityDoc: "docs/rule-engine-compatibility.md",
  masterControlSchemaDoc: "docs/master-control-schema.md",
  orchestratorV1SchemaDoc: "docs/orchestrator-v1-schema.md",
  orchestratorV1RecipesDoc: "docs/orchestrator-v1-recipes.md",
  effectiveSnapshot: "docs/effective-interactions-v2.snapshot.json",
  masterControlMarkdown: "docs/master-control-v2.md",
  masterControlJson: "docs/master-control-v2.json",
  masterControlAuthoringJson: "docs/master-control-v2.authoring.json",
  orchestratorProjectionJson: "docs/orchestrator-v1.projection.json",
  health: "docs/rule-engine-v2.health.json",
  status: "docs/rule-engine-v2.status.json",
  milestoneSmoke: "docs/rule-engine-v2.milestone-smoke.json",
  milestoneHistory: "docs/rule-engine-v2.milestone-history.jsonl",
  milestoneTrend: "docs/rule-engine-v2.milestone-trend.json",
});

export const RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS = Object.freeze([
  "effectiveSnapshot",
  "masterControlMarkdown",
  "masterControlJson",
  "masterControlAuthoringJson",
  "orchestratorProjectionJson",
  "health",
  "status",
  "milestoneSmoke",
  "milestoneHistory",
  "milestoneTrend",
]);

export const RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS = Object.freeze([
  "docsIndex",
  "interactionsSchemaDoc",
  "masterControlSchemaDoc",
  "orchestratorV1SchemaDoc",
  "orchestratorV1RecipesDoc",
  "ruleEngineSmokeDoc",
  "ruleEngineAuthoringDoc",
  "ruleEngineCompatibilityDoc",
]);

function docRelPathForKeyOrThrowV2(key) {
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("unknown RULE_ENGINE_V2_DOC_PATHS key: <invalid>");
  }
  const rel = RULE_ENGINE_V2_DOC_PATHS[key];
  if (!rel) {
    throw new Error(`unknown RULE_ENGINE_V2_DOC_PATHS key: ${key}`);
  }
  return rel;
}

export function resolveRuleEngineDocPath(key) {
  return resolve(process.cwd(), docRelPathForKeyOrThrowV2(key));
}

export function docRelPathsForKeysV2(keys) {
  if (keys == null) {
    throw new Error("docRelPathsForKeysV2 requires keys");
  }
  if (typeof keys[Symbol.iterator] !== "function") {
    throw new Error("docRelPathsForKeysV2 keys must be iterable");
  }
  return Array.from(keys).map((key, index) => {
    if (typeof key !== "string" || !key.trim()) {
      throw new Error(`docRelPathsForKeysV2 key[${index}] must be a non-empty string`);
    }
    return docRelPathForKeyOrThrowV2(key);
  });
}

export function docRelPathForKeyV2(key) {
  return docRelPathForKeyOrThrowV2(key);
}

export const RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_RELS = Object.freeze(
  docRelPathsForKeysV2(RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS)
);

export const RULE_ENGINE_V2_CORE_MARKDOWN_DOC_RELS = Object.freeze(
  docRelPathsForKeysV2(RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS)
);
