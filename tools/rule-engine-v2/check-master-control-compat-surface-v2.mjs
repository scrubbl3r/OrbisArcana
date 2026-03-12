import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { RULE_ENGINE_V2_DOC_PATHS } from "./docs-paths-v2.mjs";
import { failCheck } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

function listFiles() {
  const out = execSync("rg --files src tools docs", {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !/docs\/rule-engine-v[12]-slice-/.test(p));
}

const token = "RULE_ENGINE_MASTER_CONTROL";
const allowed = new Set([
  "src/content/spell-rules/rule-engine-master-control.js",
  "src/content/spell-rules/index.js",
  "tools/rule-engine-v2/check-policy-control-contract-v2.mjs",
  "tools/rule-engine-v2/check-runtime-policy-import-contract-v2.mjs",
  "tools/rule-engine-v2/check-doc-policy-terminology-v2.mjs",
  "tools/rule-engine-v2/check-validator-policy-terminology-v2.mjs",
  "tools/rule-engine-v2/check-master-control-compat-surface-v2.mjs",
  RULE_ENGINE_V2_DOC_PATHS.masterControlSchemaDoc,
]);

const offenders = [];
for (const rel of listFiles()) {
  const text = readFileSync(resolve(process.cwd(), rel), "utf8");
  if (!text.includes(token)) continue;
  if (!allowed.has(rel)) offenders.push(rel);
}

if (offenders.length) {
  failCheck("master-control-compat-surface:v2", `unexpected ${token} usage in: ${offenders.join(", ")}`);
}

reportCheckPass("master-control-compat-surface:v2", "compatibility surface is constrained");
