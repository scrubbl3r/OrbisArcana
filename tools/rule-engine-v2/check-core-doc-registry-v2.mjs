import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS,
  RULE_ENGINE_V2_DOC_PATHS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "core-doc-registry:v2";

const seenPaths = new Set();
for (const key of RULE_ENGINE_V2_CORE_MARKDOWN_DOC_KEYS) {
  const rel = RULE_ENGINE_V2_DOC_PATHS[key];
  if (!rel) {
    failCheck(CHECK_TAG, `missing doc path for key: ${key}`);
  }
  if (!String(rel).startsWith("docs/")) {
    failCheck(CHECK_TAG, `core doc path must be under docs/: ${key} -> ${rel}`);
  }
  if (!String(rel).endsWith(".md")) {
    failCheck(CHECK_TAG, `core doc path must be markdown: ${key} -> ${rel}`);
  }
  if (seenPaths.has(rel)) {
    failCheck(CHECK_TAG, `duplicate core doc path mapped: ${rel}`);
  }
  seenPaths.add(rel);
  if (!existsSync(resolve(process.cwd(), rel))) {
    failCheck(CHECK_TAG, `core doc file missing on disk: ${rel}`);
  }
}

reportCheckPass(CHECK_TAG, "core markdown doc registry is valid and complete");
