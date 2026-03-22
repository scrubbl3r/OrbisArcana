import { nowIso } from "./now-iso-v2.mjs";
import { resolveRuleEngineDocPath } from "./docs-paths-v2.mjs";
import { RULE_ENGINE_V2_SCHEMA_IDS } from "./schema-ids-v2.mjs";
import { writeJsonFile } from "./write-json-v2.mjs";
import { createTaggedLogger } from "./log-tag-v2.mjs";
import {
  INTERACTIONS_V2,
  projectOrchestratorV1FromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";

// Generates orchestrator-v1 projection artifact derived from interactions-v2.
// Artifact is used by docs/contract checks to detect projection drift.
const CHECK_TAG = "orchestrator-projection-doc:v2";
const log = createTaggedLogger(CHECK_TAG);

const projection = projectOrchestratorV1FromInteractionsV2(INTERACTIONS_V2);
const rules = Array.isArray(projection?.rules) ? projection.rules : [];

const artifact = {
  schema: RULE_ENGINE_V2_SCHEMA_IDS.orchestratorProjection,
  generatedAt: nowIso(),
  source: "projected_from_interactions_v2",
  projection,
  counts: {
    rules: rules.length,
  },
};

const outPath = resolveRuleEngineDocPath("orchestratorProjectionJson");
writeJsonFile(outPath, artifact);
log(`wrote ${outPath}`);
