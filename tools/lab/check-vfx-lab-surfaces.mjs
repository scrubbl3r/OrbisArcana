import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLabEffectSurfaces } from "../../labs/vfx/studio/vfx-studio-surfaces.js";
import {
  buildLivePresetModuleForBaseEffect,
  buildTeleportBehaviorModule,
} from "../../labs/vfx/studio/vfx-studio-theme-publish.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const studioHtmlPath = path.join(repoRoot, "labs/vfx/vfx-studio.html");
const previewDir = path.join(repoRoot, "labs/vfx/studio/previews");
const adapterDir = path.join(repoRoot, "labs/vfx/studio/adapters");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function collectMatches(text, re, map = (match) => match[1]) {
  const out = [];
  let match = re.exec(text);
  while (match) {
    out.push(map(match));
    match = re.exec(text);
  }
  return out;
}

function display(value) {
  return value ? "yes" : "no";
}

function pad(value, width) {
  return String(value).padEnd(width, " ");
}

function createSentinelAdapter(name) {
  const adapter = Object.freeze({ __labCheckAdapter: name });
  return () => adapter;
}

const surfaces = createLabEffectSurfaces({
  buildTeleportBehaviorModule,
  createBubbleShieldAuthoringAdapter: createSentinelAdapter("bubble-shield"),
  createElectricAoeAuthoringAdapter: createSentinelAdapter("electric-aoe"),
  createFlameAoeAuthoringAdapter: createSentinelAdapter("flame-aoe"),
  createOrbBaseAuthoringAdapter: createSentinelAdapter("orb-base"),
  createOrbGlobeAuthoringAdapter: createSentinelAdapter("orb-globe"),
  createOrbLifecycleAuthoringAdapter: createSentinelAdapter("orb-lifecycle"),
  createOrbNodAuthoringAdapter: createSentinelAdapter("orb-nod"),
  createShockwaveAuthoringAdapter: createSentinelAdapter("shockwave"),
  createTeleportAuthoringAdapter: createSentinelAdapter("teleport"),
  createWorldGlobeAuthoringAdapter: createSentinelAdapter("world-globe"),
});

const studioHtml = readText(studioHtmlPath);
const htmlEffectSections = new Set(collectMatches(studioHtml, /data-effect="([^"]+)"/g));
const htmlBehaviorSections = new Set(collectMatches(studioHtml, /data-behavior-effect="([^"]+)"/g));
const htmlPreviewRoots = new Set(collectMatches(
  studioHtml,
  /<[^>]+id="([^"]+)"[^>]*data-preview-root\b/g
));
const htmlBaseEffectOptions = new Set(collectMatches(
  studioHtml,
  /<option[^>]+data-base-effect="([^"]+)"/g
));
const importedPreviewFiles = new Set(collectMatches(
  studioHtml,
  /from "\.\/studio\/previews\/([^"]+\.js)(?:\?[^"]*)?"/g
));
const importedAdapterFiles = new Set(collectMatches(
  studioHtml,
  /from "\.\/studio\/adapters\/([^"]+\.js)(?:\?[^"]*)?"/g
));
const previewFiles = new Set(fs.readdirSync(previewDir).filter((name) => name.endsWith(".js")));
const adapterFiles = new Set(fs.readdirSync(adapterDir).filter((name) => name.endsWith(".js")));

const rows = [];
const errors = [];
const warnings = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function expectedModuleExport(moduleText, exportName) {
  return new RegExp(`export\\s+const\\s+${String(exportName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(String(moduleText || ""));
}

for (const [baseEffect, surface] of Object.entries(surfaces)) {
  const hasSection = htmlEffectSections.has(baseEffect);
  const hasPreviewRoot = surface.previewRootKey ? htmlPreviewRoots.has(surface.previewRootKey) : false;
  const hasAdapter = typeof surface.authoringAdapter === "function";
  const hasLive = !!surface.livePreset;
  const hasBehavior = !!surface.behavior;
  const hasNote = !!surface.publishNote;

  rows.push({
    baseEffect,
    category: surface.category || "",
    section: hasSection,
    previewRoot: !!surface.previewRootKey && hasPreviewRoot,
    adapter: hasAdapter,
    live: hasLive,
    behavior: hasBehavior,
    bind: !!surface.defaultBindTarget,
    note: hasNote ? surface.publishNote : "",
  });

  if (surface.previewRootKey && !hasPreviewRoot) {
    addError(`${baseEffect}: previewRootKey "${surface.previewRootKey}" has no [data-preview-root] element in vfx-studio.html`);
  }
  if (surface.previewRootKey && !hasSection) {
    addError(`${baseEffect}: has previewRootKey but no matching data-effect="${baseEffect}" section`);
  }
  if (hasSection && !surface.previewRootKey && !hasNote) {
    addError(`${baseEffect}: has HTML section but no previewRootKey or publishNote`);
  }
  if (!hasSection && hasAdapter) {
    addError(`${baseEffect}: has authoring adapter but no matching data-effect section`);
  }
  if (!hasLive && !hasBehavior && !hasNote) {
    addError(`${baseEffect}: has no livePreset, behavior, or publishNote explaining the exception`);
  }
  if (!surface.previewRootKey && !hasAdapter && !hasLive && !hasNote) {
    addError(`${baseEffect}: runtime-only shape is missing publishNote`);
  }
  if (hasLive) {
    const moduleText = buildLivePresetModuleForBaseEffect(surface.livePreset.buildKey || baseEffect, {});
    if (!moduleText) {
      addError(`${baseEffect}: livePreset buildKey "${surface.livePreset.buildKey || baseEffect}" produced no module text`);
    } else if (surface.livePreset.exportName && !expectedModuleExport(moduleText, surface.livePreset.exportName)) {
      addError(`${baseEffect}: livePreset builder did not export ${surface.livePreset.exportName}`);
    }
    if (!Array.isArray(surface.livePreset.path) || !surface.livePreset.path.length) {
      addError(`${baseEffect}: livePreset path must be a non-empty pathParts array`);
    }
  }
  if (hasBehavior) {
    const behaviorModuleText = typeof surface.behavior.buildModule === "function"
      ? surface.behavior.buildModule({})
      : "";
    if (!behaviorModuleText) {
      addError(`${baseEffect}: behavior surface produced no module text`);
    } else if (surface.behavior.exportName && !expectedModuleExport(behaviorModuleText, surface.behavior.exportName)) {
      addError(`${baseEffect}: behavior builder did not export ${surface.behavior.exportName}`);
    }
    if (!Array.isArray(surface.behavior.path) || !surface.behavior.path.length) {
      addError(`${baseEffect}: behavior path must be a non-empty pathParts array`);
    }
    if (!Array.isArray(surface.behavior.targetIds) || !surface.behavior.targetIds.length) {
      addError(`${baseEffect}: behavior targetIds must be non-empty`);
    }
    if (!htmlBehaviorSections.has(baseEffect)) {
      addError(`${baseEffect}: behavior surface has no matching data-behavior-effect section`);
    }
  }
  if (surface.registryIds && !Array.isArray(surface.registryIds)) {
    addError(`${baseEffect}: registryIds must be an array when present`);
  }
  if (surface.defaultBindTarget && !surface.registryIds && !hasNote) {
    addWarning(`${baseEffect}: defaultBindTarget is set without registryIds`);
  }
}

for (const section of htmlEffectSections) {
  if (!surfaces[section]) addError(`vfx-studio.html: data-effect="${section}" has no surface registry entry`);
}

for (const section of htmlBehaviorSections) {
  if (section !== "default" && (!surfaces[section] || !surfaces[section].behavior)) {
    addError(`vfx-studio.html: data-behavior-effect="${section}" has no behavior surface`);
  }
}

for (const baseEffect of htmlBaseEffectOptions) {
  if (!surfaces[baseEffect]) addError(`vfx-studio.html: option data-base-effect="${baseEffect}" has no surface registry entry`);
}

for (const fileName of previewFiles) {
  if (!importedPreviewFiles.has(fileName)) addWarning(`preview file is not imported by vfx-studio.html: ${fileName}`);
}

for (const fileName of adapterFiles) {
  if (!importedAdapterFiles.has(fileName)) addWarning(`adapter file is not imported by vfx-studio.html: ${fileName}`);
}

const columns = [
  ["effect", 17, (row) => row.baseEffect],
  ["cat", 7, (row) => row.category],
  ["section", 8, (row) => display(row.section)],
  ["preview", 8, (row) => display(row.previewRoot)],
  ["adapter", 8, (row) => display(row.adapter)],
  ["live", 6, (row) => display(row.live)],
  ["behavior", 9, (row) => display(row.behavior)],
  ["bind", 6, (row) => display(row.bind)],
  ["note", 10, (row) => row.note ? "yes" : ""],
];

console.log("VFX Lab Surface Matrix");
console.log(columns.map(([label, width]) => pad(label, width)).join(" "));
console.log(columns.map(([, width]) => "-".repeat(width)).join(" "));
for (const row of rows) {
  console.log(columns.map(([, width, getter]) => pad(getter(row), width)).join(" "));
}

if (warnings.length) {
  console.log("\nWarnings");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error("\nErrors");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nVFX Lab surface contract passed.");
