import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLabEffectSurfaces } from "../../labs/vfx-studio/vfx-studio-surfaces.js";
import {
  buildElectricAoe3dBehaviorModule,
  buildFlameAoe3dBehaviorModule,
  buildLivePresetModuleForBaseEffect,
  buildTeleportBehaviorModule,
} from "../../labs/vfx-studio/vfx-studio-theme-publish.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const studioHtmlPath = path.join(repoRoot, "labs/vfx-studio/vfx-studio.html");
const studioPreviewRegistryPath = path.join(repoRoot, "labs/vfx-studio/vfx-studio-preview-registry.js");
const previewDir = path.join(repoRoot, "labs/vfx-studio/previews");
const adapterDir = path.join(repoRoot, "labs/vfx-studio/adapters");

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
  buildElectricAoe3dBehaviorModule,
  buildFlameAoe3dBehaviorModule,
  buildTeleportBehaviorModule,
  createBankOrb3dAuthoringAdapter: createSentinelAdapter("bank-orb-3d"),
  createBubbleShield3dAuthoringAdapter: createSentinelAdapter("bubble-shield-3d"),
  createBubbleShieldAuthoringAdapter: createSentinelAdapter("bubble-shield"),
  createElectricAoeAuthoringAdapter: createSentinelAdapter("electric-aoe"),
  createElectricAoe3dAuthoringAdapter: createSentinelAdapter("electric-aoe-3d"),
  createFlameAoe3dAuthoringAdapter: createSentinelAdapter("flame-aoe-3d"),
  createFlameAoeAuthoringAdapter: createSentinelAdapter("flame-aoe"),
  createHealAuthoringAdapter: createSentinelAdapter("heal"),
  createOrb3dAuthoringAdapter: createSentinelAdapter("orb-3d"),
  createOrbBaseAuthoringAdapter: createSentinelAdapter("orb-base"),
  createOrbGlobe3dAuthoringAdapter: createSentinelAdapter("orb-globe-3d"),
  createOrbGlobeAuthoringAdapter: createSentinelAdapter("orb-globe"),
  createOrbLifecycle3dAuthoringAdapter: createSentinelAdapter("orb-lifecycle-3d"),
  createOrbLifecycleAuthoringAdapter: createSentinelAdapter("orb-lifecycle"),
  createOrbNodAuthoringAdapter: createSentinelAdapter("orb-nod"),
  createOrbNod3dAuthoringAdapter: createSentinelAdapter("orb-nod3d"),
  createOrbSpawnAuthoringAdapter: createSentinelAdapter("orb-spawn"),
  createShockwave3dAuthoringAdapter: createSentinelAdapter("shockwave-3d"),
  createShockwaveAuthoringAdapter: createSentinelAdapter("shockwave"),
  createTeleportAuthoringAdapter: createSentinelAdapter("teleport"),
  createTeleport3dAuthoringAdapter: createSentinelAdapter("teleport-3d"),
  createWorldGlobe3dAuthoringAdapter: createSentinelAdapter("world-globe-3d"),
  createWorldGlobeAuthoringAdapter: createSentinelAdapter("world-globe"),
});

const studioHtml = readText(studioHtmlPath);
const studioPreviewRegistry = fs.existsSync(studioPreviewRegistryPath) ? readText(studioPreviewRegistryPath) : "";
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
const importedPreviewFiles = new Set([
  ...collectMatches(
    studioHtml,
    /from "\.\/previews\/([^"]+\.js)(?:\?[^"]*)?"/g
  ),
  ...collectMatches(
    studioPreviewRegistry,
    /from "\.\/previews\/([^"]+\.js)(?:\?[^"]*)?"/g
  ),
]);
const importedAdapterFiles = new Set(collectMatches(
  studioHtml,
  /from "\.\/adapters\/([^"]+\.js)(?:\?[^"]*)?"/g
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

function pathPartsToAbs(pathParts) {
  if (!Array.isArray(pathParts) || !pathParts.length) return "";
  return path.join(repoRoot, ...pathParts.map((part) => String(part || "")));
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
  if (surface.previewRootKey && !surface.previewFile) {
    addError(`${baseEffect}: previewRootKey is set but previewFile is missing from surface registry`);
  }
  if (surface.previewFile) {
    if (!previewFiles.has(surface.previewFile)) {
      addError(`${baseEffect}: previewFile does not exist: ${surface.previewFile}`);
    }
    if (!importedPreviewFiles.has(surface.previewFile)) {
      addError(`${baseEffect}: previewFile is not imported by vfx-studio.html or vfx-studio-preview-registry.js: ${surface.previewFile}`);
    }
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
  if (hasAdapter && !surface.adapterFile) {
    addError(`${baseEffect}: authoringAdapter is set but adapterFile is missing from surface registry`);
  }
  if (surface.adapterFile) {
    if (!adapterFiles.has(surface.adapterFile)) {
      addError(`${baseEffect}: adapterFile does not exist: ${surface.adapterFile}`);
    }
    if (!importedAdapterFiles.has(surface.adapterFile)) {
      addError(`${baseEffect}: adapterFile is not imported by vfx-studio.html: ${surface.adapterFile}`);
    }
    if (!hasAdapter) {
      addError(`${baseEffect}: adapterFile is set but authoringAdapter is missing`);
    }
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
    } else if (!fs.existsSync(pathPartsToAbs(surface.livePreset.path))) {
      addError(`${baseEffect}: livePreset target file does not exist: ${surface.livePreset.path.join("/")}`);
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
    } else if (!fs.existsSync(pathPartsToAbs(surface.behavior.path))) {
      addError(`${baseEffect}: behavior target file does not exist: ${surface.behavior.path.join("/")}`);
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
  if (!importedPreviewFiles.has(fileName)) addWarning(`preview file is not imported by vfx-studio.html or vfx-studio-preview-registry.js: ${fileName}`);
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
