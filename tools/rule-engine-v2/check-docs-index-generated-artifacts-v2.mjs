import {
  RULE_ENGINE_V2_DOC_PATHS,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import {
  docsIndexLinkTokenForRelPathV2,
  docsIndexOwnershipTokenForRelPathV2,
} from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

const CHECK_TAG = "docs-index-generated-artifacts:v2";
const { rel: indexRel, text } = readDocsIndexV2();

for (const key of RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS) {
  const rel = RULE_ENGINE_V2_DOC_PATHS[key];
  const mdLink = docsIndexLinkTokenForRelPathV2(rel);
  const ownershipToken = docsIndexOwnershipTokenForRelPathV2(rel);
  if (!text.includes(mdLink)) {
    failCheck(CHECK_TAG, `${indexRel} missing generated-artifact quick link: ${rel}`);
  }
  if (!text.includes(ownershipToken)) {
    failCheck(CHECK_TAG, `${indexRel} missing generated-artifact ownership entry: ${rel}`);
  }
}

reportCheckPass(CHECK_TAG, "docs index covers all generated artifact links and ownership entries");
