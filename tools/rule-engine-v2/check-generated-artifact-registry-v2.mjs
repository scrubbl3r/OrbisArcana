import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  RULE_ENGINE_V2_DOC_PATHS,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "generated-artifact-registry:v2";

const seenPaths = new Set();
for (const key of RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS) {
  const rel = RULE_ENGINE_V2_DOC_PATHS[key];
  if (!rel) {
    failCheck(CHECK_TAG, `missing doc path for key: ${key}`);
  }
  if (!String(rel).startsWith("docs/")) {
    failCheck(CHECK_TAG, `generated artifact path must be under docs/: ${key} -> ${rel}`);
  }
  if (seenPaths.has(rel)) {
    failCheck(CHECK_TAG, `duplicate generated artifact path mapped: ${rel}`);
  }
  seenPaths.add(rel);
  if (!existsSync(resolve(process.cwd(), rel))) {
    failCheck(CHECK_TAG, `generated artifact file missing on disk: ${rel}`);
  }
}

reportCheckPass(CHECK_TAG, "generated artifact registry is valid and complete");
