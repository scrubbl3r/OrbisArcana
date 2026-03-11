import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { REGRESSION_CHECKS_V2 } from "./regression-checks-v2.mjs";

function fail(msg) {
  console.error(`[regression-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

if (!Array.isArray(REGRESSION_CHECKS_V2) || REGRESSION_CHECKS_V2.length === 0) {
  fail("REGRESSION_CHECKS_V2 must be a non-empty array");
}

const idSet = new Set();
const scriptSet = new Set();

for (const check of REGRESSION_CHECKS_V2) {
  if (!check || typeof check !== "object") {
    fail("manifest entry must be an object");
  }

  const id = String(check.id || "").trim();
  const script = String(check.script || "").trim();

  if (!id) fail("manifest entry missing id");
  if (!script) fail(`manifest entry '${id}' missing script`);
  if (!/^[-a-z0-9_]+$/.test(id)) {
    fail(`manifest id must be lowercase snake/kebab style: ${id}`);
  }
  if (!script.startsWith("tools/rule-engine-v2/") || !script.endsWith(".mjs")) {
    fail(`manifest script path must stay under tools/rule-engine-v2 and end with .mjs: ${script}`);
  }
  if (idSet.has(id)) fail(`duplicate manifest id: ${id}`);
  if (scriptSet.has(script)) fail(`duplicate manifest script: ${script}`);
  if (!existsSync(resolve(process.cwd(), script))) {
    fail(`manifest script file not found: ${script}`);
  }

  idSet.add(id);
  scriptSet.add(script);
}

console.log("[regression-manifest:v2] PASS: regression manifest integrity verified");
