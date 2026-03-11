import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { READY_PHASES_V2 } from "./ready-phases-v2.mjs";

function fail(msg) {
  console.error(`[ready-phases-manifest:v2] FAIL: ${msg}`);
  process.exit(1);
}

if (!Array.isArray(READY_PHASES_V2) || READY_PHASES_V2.length === 0) {
  fail("READY_PHASES_V2 must be a non-empty array");
}

const idSet = new Set();
const scriptSet = new Set();

for (const phase of READY_PHASES_V2) {
  if (!phase || typeof phase !== "object") {
    fail("phase entry must be an object");
  }
  const id = String(phase.id || "").trim();
  const script = String(phase.script || "").trim();
  if (!id) fail("phase entry missing id");
  if (!script) fail(`phase '${id}' missing script`);
  if (!/^[-a-z0-9_]+$/.test(id)) fail(`phase id must be lowercase snake/kebab style: ${id}`);
  if (!script.startsWith("tools/rule-engine-v2/") || !script.endsWith(".mjs")) {
    fail(`phase script path must stay under tools/rule-engine-v2 and end with .mjs: ${script}`);
  }
  if (idSet.has(id)) fail(`duplicate phase id: ${id}`);
  if (scriptSet.has(script)) fail(`duplicate phase script: ${script}`);
  if (!existsSync(resolve(process.cwd(), script))) fail(`phase script file not found: ${script}`);
  idSet.add(id);
  scriptSet.add(script);
}

console.log("[ready-phases-manifest:v2] PASS: ready phase manifest integrity verified");
