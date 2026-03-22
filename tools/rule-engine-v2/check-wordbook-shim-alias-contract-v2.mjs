import * as spellbookUtilsShim from "./spellbook-v2-utils.mjs";
import * as wordbookUtils from "./wordbook-v2-utils.mjs";
import * as spellbookManifestShim from "./kws-manifest-from-spellbook-v2.mjs";
import * as wordbookManifest from "./kws-manifest-from-wordbook-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

// Verifies spellbook-named shim modules forward canonical wordbook references exactly.
const CHECK_TAG = "wordbook-shim-alias:v2";
const PASS_MESSAGE = "legacy spellbook-named shim modules alias canonical wordbook modules";

function assertSameRef(actual, expected, label) {
  if (actual !== expected) {
    failCheck(CHECK_TAG, `${label} must be a direct alias/reference`);
  }
}

function asJson(v) {
  return JSON.stringify(v);
}

assertSameRef(
  spellbookUtilsShim.listSpellbookSpells,
  wordbookUtils.listSpellbookSpells,
  "spellbook-v2-utils.listSpellbookSpells"
);
assertSameRef(
  spellbookUtilsShim.countSpellbookSpells,
  wordbookUtils.countSpellbookSpells,
  "spellbook-v2-utils.countSpellbookSpells"
);
assertSameRef(
  spellbookUtilsShim.listActiveSpellbookSpells,
  wordbookUtils.listActiveSpellbookSpells,
  "spellbook-v2-utils.listActiveSpellbookSpells"
);
assertSameRef(
  spellbookUtilsShim.listActiveSpellModelRefs,
  wordbookUtils.listActiveSpellModelRefs,
  "spellbook-v2-utils.listActiveSpellModelRefs"
);
assertSameRef(
  spellbookUtilsShim.listActiveSpellAuthoringRows,
  wordbookUtils.listActiveSpellAuthoringRows,
  "spellbook-v2-utils.listActiveSpellAuthoringRows"
);

assertSameRef(
  spellbookManifestShim.KWS_MANIFEST_REL_PATH,
  wordbookManifest.KWS_MANIFEST_REL_PATH,
  "kws-manifest shim KWS_MANIFEST_REL_PATH"
);
assertSameRef(
  spellbookManifestShim.KWS_MODEL_REL_ROOT,
  wordbookManifest.KWS_MODEL_REL_ROOT,
  "kws-manifest shim KWS_MODEL_REL_ROOT"
);
assertSameRef(
  spellbookManifestShim.normalizeKwsManifest,
  wordbookManifest.normalizeKwsManifest,
  "kws-manifest shim normalizeKwsManifest"
);
assertSameRef(
  spellbookManifestShim.buildKwsManifestFromWordbookV2,
  wordbookManifest.buildKwsManifestFromWordbookV2,
  "kws-manifest shim buildKwsManifestFromWordbookV2"
);
assertSameRef(
  spellbookManifestShim.buildKwsManifestFromSpellbookV2,
  wordbookManifest.buildKwsManifestFromSpellbookV2,
  "kws-manifest shim buildKwsManifestFromSpellbookV2"
);

const sampleWordbook = Object.freeze({
  version: "2",
  spells: Object.freeze([
    Object.freeze({ id: "pyro", phrase: "pyro", onnx: "pyro", active: true }),
    Object.freeze({ id: "domus", phrase: "domus", onnx: "domus", active: false }),
  ]),
});

const shimManifest = spellbookManifestShim.buildKwsManifestFromSpellbookV2(sampleWordbook);
const canonicalManifest = wordbookManifest.buildKwsManifestFromWordbookV2(sampleWordbook);
if (asJson(shimManifest) !== asJson(canonicalManifest)) {
  failCheck(CHECK_TAG, "kws-manifest shim output must match canonical wordbook manifest output");
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
