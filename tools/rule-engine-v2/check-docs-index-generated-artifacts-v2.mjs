import {
  docRelPathsForKeysV2,
  RULE_ENGINE_V2_DOC_PATHS,
  RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS,
} from "./docs-paths-v2.mjs";
import {
  docsIndexLinkTokensForRelPathsV2,
  docsIndexOwnershipTokensForRelPathsV2,
} from "./docs-index-tokens-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { requireTextIncludesTokensV2 } from "./check-token-assertions-v2.mjs";
import { readDocsIndexV2 } from "./read-docs-index-v2.mjs";

const CHECK_TAG = "docs-index-generated-artifacts:v2";
const { rel: indexRel, text } = readDocsIndexV2();

const generatedArtifactRels = docRelPathsForKeysV2(RULE_ENGINE_V2_GENERATED_ARTIFACT_DOC_KEYS);
const requiredQuickLinkTokens = docsIndexLinkTokensForRelPathsV2(generatedArtifactRels);
const requiredOwnershipTokens = docsIndexOwnershipTokensForRelPathsV2(generatedArtifactRels);

requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredQuickLinkTokens,
  missingMessage: (token) => `${indexRel} missing generated-artifact quick link token: ${token}`,
});
requireTextIncludesTokensV2({
  tag: CHECK_TAG,
  text,
  tokens: requiredOwnershipTokens,
  missingMessage: (token) => `${indexRel} missing generated-artifact ownership token: ${token}`,
});

reportCheckPass(CHECK_TAG, "docs index covers all generated artifact links and ownership entries");
