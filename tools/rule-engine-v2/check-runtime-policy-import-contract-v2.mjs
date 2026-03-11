import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(msg) {
  console.error(`[runtime-policy-import-contract:v2] FAIL: ${msg}`);
  process.exit(1);
}

const root = process.cwd();
const targets = [
  "src/runtime/receiver-bootstrap.js",
];

const forbidden = "RULE_ENGINE_MASTER_CONTROL";
const required = "RULE_ENGINE_POLICY_CONTROL";

for (const rel of targets) {
  const abs = resolve(root, rel);
  const text = readFileSync(abs, "utf8");
  if (text.includes(forbidden)) {
    fail(`${rel} must not reference ${forbidden}`);
  }
  if (!text.includes(required)) {
    fail(`${rel} must reference ${required}`);
  }
}

console.log("[runtime-policy-import-contract:v2] PASS: runtime imports policy control only");
