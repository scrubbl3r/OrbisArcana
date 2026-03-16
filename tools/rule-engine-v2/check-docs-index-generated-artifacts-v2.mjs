import { basename } from "node:path";
import {
  RULE_ENGINE_V2_DOC_PATHS,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "docs-index-generated-artifacts:v2";
const indexRel = RULE_ENGINE_V2_DOC_PATHS.docsIndex;
const text = readRelativeText(indexRel);

for (const key of RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS) {
  const rel = RULE_ENGINE_V2_DOC_PATHS[key];
  const file = basename(rel);
  const mdLink = `](./${file})`;
  const ownershipToken = `\`${rel}\``;
  if (!text.includes(mdLink)) {
    failCheck(CHECK_TAG, `${indexRel} missing generated-artifact quick link: ${file}`);
  }
  if (!text.includes(ownershipToken)) {
    failCheck(CHECK_TAG, `${indexRel} missing generated-artifact ownership entry: ${rel}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index covers all generated artifact links and ownership entries");
