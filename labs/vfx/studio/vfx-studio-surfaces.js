export function createLabEffectSurfaces({
  buildTeleportBehaviorModule,
  createBubbleShieldAuthoringAdapter,
  createElectricAoeAuthoringAdapter,
  createFlameAoeAuthoringAdapter,
  createOrbBaseAuthoringAdapter,
  createOrbGlobeAuthoringAdapter,
  createOrbLifecycleAuthoringAdapter,
  createOrbNodAuthoringAdapter,
  createShockwaveAuthoringAdapter,
  createTeleportAuthoringAdapter,
  createWorldGlobeAuthoringAdapter,
} = {}) {
  return Object.freeze({
    "electric-aoe": Object.freeze({
      category: "spell",
      settingsKey: "electric-aoe",
      defaultSettingsKey: "electric-aoe",
      registryIds: Object.freeze(["spell.aoe_electric"]),
      previewRootKey: "electricPreviewRoot",
      previewFile: "electric-aoe-preview.js",
      autoPreviewKey: "playElectric",
      defaultBindTarget: "spell.aoe_electric",
      livePreset: Object.freeze({ buildKey: "electric-aoe", path: ["src", "vfx", "presets", "electric-aoe-default.js"], exportName: "ELECTRIC_AOE_PRESET_DEFAULT" }),
      adapterFile: "electric-aoe-authoring-adapter.js",
      authoringAdapter: createElectricAoeAuthoringAdapter,
    }),
    "flame-aoe": Object.freeze({
      category: "spell",
      settingsKey: "flame-aoe",
      defaultSettingsKey: "flame-aoe",
      registryIds: Object.freeze(["spell.aoe_flame"]),
      previewRootKey: "flamePreviewRoot",
      previewFile: "flame-aoe-preview.js",
      autoPreviewKey: "playFlame",
      defaultBindTarget: "spell.aoe_flame",
      livePreset: Object.freeze({ buildKey: "flame-aoe", path: ["src", "vfx", "presets", "flame-aoe-default.js"], exportName: "FLAME_AOE_PRESET_DEFAULT" }),
      adapterFile: "flame-aoe-authoring-adapter.js",
      authoringAdapter: createFlameAoeAuthoringAdapter,
    }),
    "bubble-shield": Object.freeze({
      category: "spell",
      settingsKey: "bubble-shield",
      defaultSettingsKey: "bubble-shield",
      registryIds: Object.freeze(["spell.shield_bubble"]),
      previewRootKey: "shieldPreviewRoot",
      previewFile: "shield-preview.js",
      autoPreviewKey: "playShield",
      defaultBindTarget: "spell.bubble_shield",
      livePreset: Object.freeze({ buildKey: "bubble-shield", path: ["src", "vfx", "presets", "bubble-shield-default.js"], exportName: "BUBBLE_SHIELD_PRESET_DEFAULT" }),
      adapterFile: "bubble-shield-authoring-adapter.js",
      authoringAdapter: createBubbleShieldAuthoringAdapter,
    }),
    "shockwave": Object.freeze({
      category: "spell",
      settingsKey: "shockwave",
      defaultSettingsKey: "shockwave",
      registryIds: Object.freeze(["spell.shockwave_ring"]),
      previewRootKey: "shockPreviewRoot",
      previewFile: "shockwave-preview.js",
      autoPreviewKey: "playShock",
      defaultBindTarget: "spell.shockwave",
      livePreset: Object.freeze({ buildKey: "shockwave", path: ["src", "vfx", "presets", "shockwave-default.js"], exportName: "SHOCKWAVE_PRESET_DEFAULT" }),
      adapterFile: "shockwave-authoring-adapter.js",
      authoringAdapter: createShockwaveAuthoringAdapter,
    }),
    "teleport": Object.freeze({
      category: "spell",
      settingsKey: "teleport",
      defaultSettingsKey: "teleport",
      registryIds: Object.freeze(["spell.teleport"]),
      previewRootKey: "orbTeleportPreviewRoot",
      previewFile: "orb-teleport-preview.js",
      autoPreviewKey: "applyOrbTeleport",
      defaultBindTarget: "spell.teleport",
      livePreset: Object.freeze({ buildKey: "teleport", path: ["src", "vfx", "presets", "teleport-default.js"], exportName: "TELEPORT_PRESET_DEFAULT" }),
      behavior: Object.freeze({
        targetIds: Object.freeze(["spell.teleport"]),
        path: ["src", "game-runtime", "behaviors", "teleport-behavior-default.js"],
        exportName: "TELEPORT_BEHAVIOR_DEFAULT",
        buildModule: buildTeleportBehaviorModule,
      }),
      adapterFile: "teleport-authoring-adapter.js",
      authoringAdapter: createTeleportAuthoringAdapter,
    }),
    "orb-base": Object.freeze({
      label: "Orb Base",
      category: "orb",
      settingsKey: "orb-base",
      defaultSettingsKey: "orb-base",
      builtinOption: true,
      previewRootKey: "orbBasePreviewRoot",
      previewFile: "orb-base-preview.js",
      autoPreviewKey: "applyOrbBase",
      livePreset: Object.freeze({ buildKey: "orb-base", path: ["src", "game-runtime", "orb", "orb-base-default.js"], exportName: "ORB_BASE_VISUAL_DEFAULTS" }),
      adapterFile: "orb-base-authoring-adapter.js",
      authoringAdapter: createOrbBaseAuthoringAdapter,
    }),
    "orb-template": Object.freeze({
      label: "Orb Template",
      category: "orb",
      settingsKey: "orb-template",
      defaultSettingsKey: "orb-template",
      builtinOption: true,
      previewRootKey: "orbTemplatePreviewRoot",
      previewFile: "orb-template-preview.js",
      autoPreviewKey: "applyOrbTemplate",
      publishNote: "Seed-only authoring lane; intentionally has no live runtime target.",
    }),
    "orb-nod": Object.freeze({
      category: "orb",
      settingsKey: "orb-nod",
      defaultSettingsKey: "orb-nod",
      settingsParamPrefix: "orbTemplate",
      registryIds: Object.freeze(["orb.nod"]),
      previewRootKey: "orbNodPreviewRoot",
      previewFile: "orb-template-preview.js",
      autoPreviewKey: "applyOrbNod",
      defaultBindTarget: "orb-state.nod",
      livePreset: Object.freeze({ buildKey: "orb-nod", path: ["src", "vfx", "presets", "orb-nod-default.js"], exportName: "ORB_NOD_PRESET_DEFAULT" }),
      adapterFile: "orb-nod-authoring-adapter.js",
      authoringAdapter: createOrbNodAuthoringAdapter,
    }),
    "orb-globe": Object.freeze({
      label: "Orb Globe",
      category: "orb",
      settingsKey: "orb-globe",
      defaultSettingsKey: "orb-globe",
      registryIds: Object.freeze(["orb.globe"]),
      omitRegistryOption: true,
      builtinOption: true,
      previewRootKey: "orbGlobePreviewRoot",
      previewFile: "orb-globe-preview.js",
      autoPreviewKey: "applyOrbGlobe",
      defaultBindTarget: "orb-state.globe_loaded",
      livePreset: Object.freeze({ buildKey: "orb-globe", path: ["src", "game-runtime", "orb", "orb-globe-default.js"], exportName: "ORB_GLOBE_VISUAL_DEFAULTS" }),
      adapterFile: "orb-globe-authoring-adapter.js",
      authoringAdapter: createOrbGlobeAuthoringAdapter,
    }),
    "orb-lifecycle": Object.freeze({
      label: "Orb Lifecycle",
      category: "orb",
      settingsKey: "orb-lifecycle",
      defaultSettingsKey: "orb-lifecycle",
      builtinOption: true,
      previewRootKey: "orbLifecyclePreviewRoot",
      previewFile: "orb-lifecycle-preview.js",
      autoPreviewKey: "applyOrbLifecycle",
      livePreset: Object.freeze({ buildKey: "orb-lifecycle", path: ["src", "game-runtime", "orb", "orb-lifecycle-default.js"], exportName: "ORB_LIFECYCLE_DEFAULTS" }),
      adapterFile: "orb-lifecycle-authoring-adapter.js",
      authoringAdapter: createOrbLifecycleAuthoringAdapter,
    }),
    "orb-shatter": Object.freeze({
      category: "orb",
      settingsKey: "orb-shatter",
      defaultSettingsKey: "orb-shatter",
      registryIds: Object.freeze(["orb.shatter_voronoi"]),
      omitRegistryOption: true,
      defaultBindTarget: "orb-state.shattered",
      publishNote: "Runtime-only shatter effect; author shard/crack styling through Orb Lifecycle.",
    }),
    "world-globe": Object.freeze({
      category: "world",
      settingsKey: "world-globe",
      defaultSettingsKey: "world-globe",
      registryIds: Object.freeze(["world.globe"]),
      previewRootKey: "worldGlobePreviewRoot",
      previewFile: "world-globe-preview.js",
      autoPreviewKey: "applyWorldGlobe",
      livePreset: Object.freeze({ buildKey: "world-globe", path: ["src", "game-runtime", "world", "world-globe-default.js"], exportName: "WORLD_GLOBE_VISUAL_DEFAULTS" }),
      adapterFile: "world-globe-authoring-adapter.js",
      authoringAdapter: createWorldGlobeAuthoringAdapter,
    }),
  });
}

export function deriveLabSurfaceMaps({ surfaces, buildLivePresetModuleForBaseEffect } = {}) {
  const labEffectSurfaces = surfaces && typeof surfaces === "object" ? surfaces : {};
  const labBehaviorSurfaces = Object.freeze(
    Object.fromEntries(Object.entries(labEffectSurfaces)
      .filter(([, surface]) => surface.behavior)
      .map(([baseEffect, surface]) => [baseEffect, Object.freeze({ baseEffect, ...surface.behavior })]))
  );

  return Object.freeze({
    studioBaseEffectByRegistryId: Object.freeze(
      Object.fromEntries(Object.entries(labEffectSurfaces).flatMap(([baseEffect, surface]) => (
        Array.isArray(surface.registryIds) ? surface.registryIds.map((registryId) => [String(registryId), baseEffect]) : []
      )))
    ),
    studioOmitRegistryIds: Object.freeze(
      Object.entries(labEffectSurfaces).flatMap(([, surface]) => (
        surface.omitRegistryOption && Array.isArray(surface.registryIds) ? surface.registryIds.map((registryId) => String(registryId)) : []
      ))
    ),
    defaultBindTargetByEffectId: Object.freeze({
      ...Object.fromEntries(Object.entries(labEffectSurfaces).flatMap(([, surface]) => (
        surface.defaultBindTarget && Array.isArray(surface.registryIds)
          ? surface.registryIds.map((registryId) => [String(registryId), surface.defaultBindTarget])
          : []
      ))),
      ...Object.fromEntries(Object.entries(labEffectSurfaces)
        .filter(([, surface]) => surface.defaultBindTarget)
        .map(([baseEffect, surface]) => [baseEffect, surface.defaultBindTarget])),
    }),
    settingsKeyByBaseEffect: Object.freeze(
      Object.fromEntries(Object.entries(labEffectSurfaces)
        .map(([baseEffect, surface]) => [baseEffect, surface.settingsKey || baseEffect]))
    ),
    defaultSettingsKeyByBaseEffect: Object.freeze(
      Object.fromEntries(Object.entries(labEffectSurfaces)
        .map(([baseEffect, surface]) => [baseEffect, surface.defaultSettingsKey || surface.settingsKey || baseEffect]))
    ),
    studioExtraBuiltinOptions: Object.freeze(
      Object.entries(labEffectSurfaces)
        .filter(([, surface]) => surface.builtinOption)
        .map(([baseEffect, surface]) => ({
          value: baseEffect,
          label: surface.label || baseEffect,
          baseEffect,
          category: surface.category || "orb",
          registryId: Array.isArray(surface.registryIds) ? surface.registryIds[0] || "" : "",
          locked: true,
        }))
    ),
    livePresetModulesByBaseEffect: Object.freeze(
      Object.fromEntries(Object.entries(labEffectSurfaces)
        .filter(([, surface]) => surface.livePreset)
        .map(([baseEffect, surface]) => [baseEffect, surface.livePreset]))
    ),
    livePresetBuildersByBaseEffect: Object.freeze(
      Object.fromEntries(Object.entries(labEffectSurfaces)
        .filter(([, surface]) => surface.livePreset)
        .map(([baseEffect, surface]) => [
          baseEffect,
          (params) => buildLivePresetModuleForBaseEffect(surface.livePreset.buildKey || baseEffect, params),
        ]))
    ),
    labBehaviorSurfaces,
    labAuthoringAdapterFactoriesByBaseEffect: Object.freeze(
      Object.fromEntries(Object.entries(labEffectSurfaces)
        .filter(([, surface]) => typeof surface.authoringAdapter === "function")
        .map(([baseEffect, surface]) => [baseEffect, surface.authoringAdapter]))
    ),
    liveBehaviorModulesByBaseEffect: Object.freeze(
      Object.fromEntries(Object.entries(labBehaviorSurfaces).map(([baseEffect, surface]) => [
        baseEffect,
        { path: surface.path, exportName: surface.exportName },
      ]))
    ),
    liveBehaviorBuildersByBaseEffect: Object.freeze(
      Object.fromEntries(Object.entries(labBehaviorSurfaces).map(([baseEffect, surface]) => [
        baseEffect,
        surface.buildModule,
      ]))
    ),
    behaviorBaseEffectByTargetId: Object.freeze(
      Object.fromEntries(Object.entries(labBehaviorSurfaces).flatMap(([baseEffect, surface]) => (
        Array.isArray(surface.targetIds) ? surface.targetIds.map((targetId) => [String(targetId).trim().toLowerCase(), baseEffect]) : []
      )))
    ),
  });
}
