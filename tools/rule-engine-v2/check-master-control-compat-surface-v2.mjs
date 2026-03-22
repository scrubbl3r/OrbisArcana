import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findMatchedFilesFromRg, findUnexpectedTokenFiles } from "./offender-utils-v2.mjs";
import { RULE_ENGINE_MASTER_CONTROL_TOKEN_V2 } from "./policy-terms-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Restricts legacy master-control token usage to an explicit compatibility allowlist.
const CHECK_TAG = "master-control-compat-surface:v2";
const LIST_FILES_RG = "rg --files src tools docs";
const SLICE_DOC_EXCLUDE_RE = /docs\/rule-engine-v[12]-slice-/;
const PASS_MESSAGE = "compatibility surface is constrained";
const OFFENDER_MESSAGE_PREFIX = "unexpected";

const listFiles = () => findMatchedFilesFromRg(runRgLines, LIST_FILES_RG)
  .filter((p) => !SLICE_DOC_EXCLUDE_RE.test(p));

const token = RULE_ENGINE_MASTER_CONTROL_TOKEN_V2;
const ALLOW = Object.freeze(new Set([
  "src/content/spell-rules/rule-engine-master-control.js",
  "src/content/spell-rules/index.js",
  "tools/rule-engine-v2/check-policy-control-contract-v2.mjs",
  "tools/rule-engine-v2/check-runtime-policy-import-contract-v2.mjs",
  "tools/rule-engine-v2/check-doc-policy-terminology-v2.mjs",
  "tools/rule-engine-v2/check-validator-policy-terminology-v2.mjs",
  "tools/rule-engine-v2/policy-terms-v2.mjs",
  "tools/rule-engine-v2/check-master-control-compat-surface-v2.mjs",
  RULE_ENGINE_V2_DOC_PATHS.masterControlSchemaDoc,
]));

const offenders = findUnexpectedTokenFiles(listFiles(), readRelativeText, token, ALLOW);

failIfOffenders(CHECK_TAG, offenders, `${OFFENDER_MESSAGE_PREFIX} ${token} usage in`);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
