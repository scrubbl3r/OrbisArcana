import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";
import { readRelativeText } from "./read-text-v2.mjs";

const CHECK_TAG = "runtime-policy-import-contract:v2";
const targets = [
  "src/runtime/receiver-bootstrap.js",
];

const forbidden = "RULE_ENGINE_MASTER_CONTROL";
const required = "RULE_ENGINE_POLICY_CONTROL";

for (const rel of targets) {
  const text = readRelativeText(rel);
  if (text.includes(forbidden)) {
    failCheck(CHECK_TAG, `${rel} must not reference ${forbidden}`);
  }
  if (!text.includes(required)) {
    failCheck(CHECK_TAG, `${rel} must reference ${required}`);
  }
}

reportCheckPass(CHECK_TAG, "runtime imports policy control only");
