import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function validateManifestEntries({
  entries,
  manifestName = "manifest",
  entryLabel = "entry",
}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`${manifestName} must be a non-empty array`);
  }

  const idSet = new Set();
  const scriptSet = new Set();

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      throw new Error(`${entryLabel} entry must be an object`);
    }

    const id = String(entry.id || "").trim();
    const script = String(entry.script || "").trim();

    if (!id) throw new Error(`${entryLabel} entry missing id`);
    if (!script) throw new Error(`${entryLabel} entry '${id}' missing script`);
    if (!/^[-a-z0-9_]+$/.test(id)) {
      throw new Error(`${entryLabel} id must be lowercase snake/kebab style: ${id}`);
    }
    if (!script.startsWith("tools/rule-engine-v2/") || !script.endsWith(".mjs")) {
      throw new Error(`${entryLabel} script path must stay under tools/rule-engine-v2 and end with .mjs: ${script}`);
    }
    if (idSet.has(id)) throw new Error(`duplicate ${entryLabel} id: ${id}`);
    if (scriptSet.has(script)) throw new Error(`duplicate ${entryLabel} script: ${script}`);
    if (!existsSync(resolve(process.cwd(), script))) {
      throw new Error(`${entryLabel} script file not found: ${script}`);
    }

    idSet.add(id);
    scriptSet.add(script);
  }
}
