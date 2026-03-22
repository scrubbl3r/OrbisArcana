import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

// Ensures runtime spellbook bridge stays a pure re-export shim over wordbook.
const CHECK_TAG = "wordbook-runtime-bridge-shim:v2";
const RUNTIME_BRIDGE_PATH = "src/voice/spellbook.js";
const PASS_MESSAGE = "runtime spellbook bridge remains a thin wordbook re-export shim";

const text = readRelativeText(RUNTIME_BRIDGE_PATH);

if (!text.includes("from \"./wordbook.js\"")) {
  failCheck(CHECK_TAG, `${RUNTIME_BRIDGE_PATH} must re-export from ./wordbook.js`);
}
if (/\bimport\b/.test(text)) {
  failCheck(CHECK_TAG, `${RUNTIME_BRIDGE_PATH} must remain a re-export shim (no imports)`);
}
if (!/\bexport\s*\{[\s\S]*SPELLS[\s\S]*SPELLS_BY_ID[\s\S]*ACTIVE_SPELLS[\s\S]*ACTIVE_SPELLS_BY_ID[\s\S]*\}\s*from\s*"\.\/wordbook\.js";/m.test(text)) {
  failCheck(CHECK_TAG, `${RUNTIME_BRIDGE_PATH} must export SPELLS/SPELLS_BY_ID/ACTIVE_SPELLS/ACTIVE_SPELLS_BY_ID from ./wordbook.js`);
}

reportCheckPass(CHECK_TAG, PASS_MESSAGE);
