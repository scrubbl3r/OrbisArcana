// Reads docs index path/text together for link/token checks.
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
// Returns both relative path and file text for downstream diagnostics.
export function readDocsIndexV2() {
  const rel = RULE_ENGINE_V2_DOC_PATHS.docsIndex;
  return {
    rel,
    text: readRelativeText(rel),
  };
}
