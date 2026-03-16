import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-index-orchestrator-links:v2";
const docsIndexRel = "docs/rule-engine-v2-docs-index.md";
const text = readRelativeText(docsIndexRel);

const requiredTokens = Object.freeze([
  "[Orchestrator Projection](./orchestrator-v1.projection.json)",
  "Effective Interactions Snapshot` and `Orchestrator Projection`",
]);

for (const token of requiredTokens) {
  if (!text.includes(token)) {
    failCheck(CHECK_TAG, `${docsIndexRel} missing required token: ${token}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index includes orchestrator projection links");
