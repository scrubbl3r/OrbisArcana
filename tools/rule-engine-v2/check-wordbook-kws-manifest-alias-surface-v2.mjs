import { reportCheckPass } from "./check-pass-v2.mjs";
import { failIfOffenders, findUnexpectedFilesFromRg } from "./offender-utils-v2.mjs";
import { runRgLines } from "./rg-lines-v2.mjs";

// Ensures legacy spellbook-named KWS manifest builder usage stays compatibility-only.
const CHECK_TAG = "wordbook-kws-manifest-alias-surface:v2";
const PASS_MESSAGE = "legacy buildKwsManifestFromSpellbookV2 usage is constrained to explicit compatibility files";

const ALLOW = Object.freeze(new Set([
  "tools/rule-engine-v2/kws-manifest-from-wordbook-v2.mjs",
  "tools/rule-engine-v2/kws-manifest-from-spellbook-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-shim-alias-contract-v2.mjs",
  "tools/rule-engine-v2/check-wordbook-kws-manifest-alias-surface-v2.mjs",
]));

const offenders = findUnexpectedFilesFromRg(
  runRgLines,
  "rg -n \"buildKwsManifestFromSpellbookV2\" src tools/rule-engine-v2",
  ALLOW
);
failIfOffenders(
  CHECK_TAG,
  offenders,
  "legacy buildKwsManifestFromSpellbookV2 usage outside compatibility surface"
);

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
