export function createLabEffectSurfaces({
  buildFlameAoe3dBehaviorModule,
  buildTesla1BehaviorModule,
  buildTeleportBehaviorModule,
  createBubbleShield3dAuthoringAdapter,
  createBubbleShieldAuthoringAdapter,
  createFlameAoe3dAuthoringAdapter,
  createFlameAoeAuthoringAdapter,
  createHealAuthoringAdapter,
  createBankOrb3dAuthoringAdapter,
  createOrb3dAuthoringAdapter,
  createOrbBaseAuthoringAdapter,
  createOrbGlobe3dAuthoringAdapter,
  createOrbGlobeAuthoringAdapter,
  createOrbLifecycle3dAuthoringAdapter,
  createOrbLifecycleAuthoringAdapter,
  createOrbNodAuthoringAdapter,
  createOrbNod3dAuthoringAdapter,
  createOrbSpawnAuthoringAdapter,
  createShockwave3dAuthoringAdapter,
  createShockwaveAuthoringAdapter,
  createTeleport3dAuthoringAdapter,
  createTeleportAuthoringAdapter,
  createTesla1AuthoringAdapter,
  createWorldGlobe3dAuthoringAdapter,
  createWorldGlobeAuthoringAdapter,
} = {}) {
  return Object.freeze({
    "tesla-1": Object.freeze({
      label: "Tesla 1",
      category: "spell",
	      panes: Object.freeze(["vfx", "behavior"]),
      settingsKey: "tesla-1",
      defaultSettingsKey: "tesla-1",
      builtinOption: true,
      registryIds: Object.freeze(["spell.tesla_1"]),
      previewRootKey: "flameAoe3dPreviewRoot",
      previewFile: "tesla-1-preview.js",
      autoPreviewKey: "applyTesla1",
      defaultBindTarget: "spell.tesla_1",
      livePreset: Object.freeze({ buildKey: "tesla-1", path: ["src", "vfx", "presets", "tesla-1-default.js"], exportName: "TESLA_1_PRESET_DEFAULT" }),
      behavior: Object.freeze({
        targetIds: Object.freeze(["spell.tesla_1"]),
        path: ["src", "game-runtime", "behaviors", "tesla-1-behavior-default.js"],
        exportName: "TESLA_1_BEHAVIOR_DEFAULT",
        buildModule: buildTesla1BehaviorModule,
      }),
      adapterFile: "tesla-1-authoring-adapter.js",
      authoringAdapter: createTesla1AuthoringAdapter,
    }),
    "flame-aoe": Object.freeze({
      category: "spell",
      panes: Object.freeze(["vfx"]),
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
    "flame-aoe-3d": Object.freeze({
      label: "Flame AOE 3D",
      category: "spell",
      panes: Object.freeze(["vfx", "behavior"]),
      settingsKey: "flame-aoe-3d",
      defaultSettingsKey: "flame-aoe-3d",
      builtinOption: true,
      registryIds: Object.freeze(["spell.aoe_flame"]),
      previewRootKey: "flameAoe3dPreviewRoot",
      previewFile: "flame-aoe-3d-preview.js",
      autoPreviewKey: "applyFlameAoe3d",
      defaultBindTarget: "spell.aoe_flame",
      livePreset: Object.freeze({ buildKey: "flame-aoe-3d", path: ["src", "vfx", "presets", "flame-aoe-3d-default.js"], exportName: "FLAME_AOE_3D_PRESET_DEFAULT" }),
      behavior: Object.freeze({
        targetIds: Object.freeze(["spell.aoe_flame"]),
        path: ["src", "game-runtime", "behaviors", "flame-aoe-behavior-default.js"],
        exportName: "FLAME_AOE_BEHAVIOR_DEFAULT",
        buildModule: buildFlameAoe3dBehaviorModule,
      }),
      adapterFile: "flame-aoe-3d-authoring-adapter.js",
      authoringAdapter: createFlameAoe3dAuthoringAdapter,
    }),
    "heal": Object.freeze({
      label: "Heal",
      category: "spell",
      panes: Object.freeze(["vfx"]),
      settingsKey: "heal",
      defaultSettingsKey: "heal",
      builtinOption: true,
      registryIds: Object.freeze(["spell.heal"]),
      previewRootKey: "healPreviewRoot",
      previewFile: "heal-preview.js",
      autoPreviewKey: "applyHeal",
      defaultBindTarget: "spell.heal",
      livePreset: Object.freeze({ buildKey: "heal", path: ["src", "vfx", "presets", "heal-default.js"], exportName: "HEAL_PRESET_DEFAULT" }),
      adapterFile: "heal-authoring-adapter.js",
      authoringAdapter: createHealAuthoringAdapter,
    }),
    "bank-orb-3d": Object.freeze({
      label: "Blank Orb 3D",
      category: "spell",
      panes: Object.freeze(["vfx"]),
      settingsKey: "bank-orb-3d",
      defaultSettingsKey: "bank-orb-3d",
      builtinOption: true,
      previewRootKey: "bankOrb3dPreviewRoot",
      previewFile: "bank-orb-3d-preview.js",
      autoPreviewKey: "applyBankOrb3d",
      publishNote: "Studio preview utility for authoring 3D orb-derived effects; it is not published as a runtime spell preset.",
      adapterFile: "bank-orb-3d-authoring-adapter.js",
      authoringAdapter: createBankOrb3dAuthoringAdapter,
    }),
    "shockwave-3d": Object.freeze({
      label: "Shockwave 3D",
      category: "spell",
      panes: Object.freeze(["vfx"]),
      settingsKey: "shockwave-3d",
      defaultSettingsKey: "shockwave-3d",
      builtinOption: true,
      registryIds: Object.freeze(["spell.shockwave_sphere3d"]),
      previewRootKey: "shockwave3dPreviewRoot",
      previewFile: "shockwave-3d-preview.js",
      autoPreviewKey: "playShockwave3d",
      defaultBindTarget: "spell.shockwave",
      livePreset: Object.freeze({ buildKey: "shockwave-3d", path: ["src", "vfx", "presets", "shockwave-3d-default.js"], exportName: "SHOCKWAVE_3D_PRESET_DEFAULT" }),
      adapterFile: "shockwave-3d-authoring-adapter.js",
      authoringAdapter: createShockwave3dAuthoringAdapter,
    }),
    "bubble-shield": Object.freeze({
      category: "spell",
      panes: Object.freeze(["vfx"]),
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
    "bubble-shield-3d": Object.freeze({
      category: "spell",
      panes: Object.freeze(["vfx"]),
      settingsKey: "bubble-shield-3d",
      defaultSettingsKey: "bubble-shield-3d",
      registryIds: Object.freeze(["spell.shield_bubble3d"]),
      previewRootKey: "bubbleShield3dPreviewRoot",
      previewFile: "bubble-shield-3d-preview.js",
      autoPreviewKey: "playBubbleShield3d",
      defaultBindTarget: "spell.bubble_shield",
      livePreset: Object.freeze({ buildKey: "bubble-shield-3d", path: ["src", "vfx", "presets", "bubble-shield-3d-default.js"], exportName: "BUBBLE_SHIELD_3D_PRESET_DEFAULT" }),
      adapterFile: "bubble-shield-3d-authoring-adapter.js",
      authoringAdapter: createBubbleShield3dAuthoringAdapter,
    }),
    "shockwave": Object.freeze({
      category: "spell",
      panes: Object.freeze(["vfx"]),
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
      panes: Object.freeze(["vfx", "behavior"]),
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
    "teleport-3d": Object.freeze({
      label: "Teleport 3D",
      category: "spell",
      panes: Object.freeze(["vfx", "behavior"]),
      settingsKey: "teleport-3d",
      defaultSettingsKey: "teleport-3d",
      builtinOption: true,
      registryIds: Object.freeze(["spell.teleport"]),
      previewRootKey: "orbTeleport3dPreviewRoot",
      previewFile: "orb-teleport-3d-preview.js",
      autoPreviewKey: "applyOrbTeleport3d",
      defaultBindTarget: "spell.teleport",
      livePreset: Object.freeze({ buildKey: "teleport", path: ["src", "vfx", "presets", "teleport-default.js"], exportName: "TELEPORT_PRESET_DEFAULT" }),
      behavior: Object.freeze({
        targetIds: Object.freeze(["spell.teleport"]),
        path: ["src", "game-runtime", "behaviors", "teleport-behavior-default.js"],
        exportName: "TELEPORT_BEHAVIOR_DEFAULT",
        buildModule: buildTeleportBehaviorModule,
      }),
      adapterFile: "teleport-3d-authoring-adapter.js",
      authoringAdapter: createTeleport3dAuthoringAdapter,
    }),
    "float": Object.freeze({
      label: "Float 3D",
      category: "spell",
      panes: Object.freeze(["vfx"]),
      settingsKey: "bank-orb-3d",
      defaultSettingsKey: "bank-orb-3d",
      registryIds: Object.freeze(["spell.float"]),
      previewRootKey: "bankOrb3dPreviewRoot",
      previewFile: "bank-orb-3d-preview.js",
      autoPreviewKey: "applyBankOrb3d",
      defaultBindTarget: "spell.float",
      publishNote: "Blank-orb stub lane for Float 3D; visual design is pending.",
    }),
    "orb-base": Object.freeze({
      label: "Orb Base",
      category: "orb",
      panes: Object.freeze(["vfx"]),
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
      panes: Object.freeze(["vfx"]),
      settingsKey: "orb-template",
      defaultSettingsKey: "orb-template",
      builtinOption: true,
      previewRootKey: "orbTemplatePreviewRoot",
      previewFile: "orb-template-preview.js",
      autoPreviewKey: "applyOrbTemplate",
      publishNote: "Seed-only authoring lane; intentionally has no live runtime target.",
    }),
    "orb-3d": Object.freeze({
      label: "Orb 3D",
      category: "orb",
      panes: Object.freeze(["vfx"]),
      settingsKey: "orb-3d",
      defaultSettingsKey: "orb-3d",
      builtinOption: true,
      previewRootKey: "orb3dPreviewRoot",
      previewFile: "orb-3d-preview.js",
      autoPreviewKey: "applyOrb3d",
      livePreset: Object.freeze({ buildKey: "orb-3d", path: ["src", "game-runtime", "orb", "orb-3d-default.js"], exportName: "ORB_3D_VISUAL_DEFAULTS" }),
      adapterFile: "orb-3d-authoring-adapter.js",
      authoringAdapter: createOrb3dAuthoringAdapter,
    }),
    "orb-nod": Object.freeze({
      category: "orb",
      panes: Object.freeze(["vfx"]),
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
    "orb-nod3d": Object.freeze({
      label: "Orb Nod 3D",
      category: "orb",
      panes: Object.freeze(["vfx"]),
      settingsKey: "orb-nod3d",
      defaultSettingsKey: "orb-nod3d",
      registryIds: Object.freeze(["orb.nod3d"]),
      previewRootKey: "orbNod3dPreviewRoot",
      previewFile: "orb-nod3d-preview.js",
      autoPreviewKey: "applyOrbNod3d",
      defaultBindTarget: "orb-state.nod",
      livePreset: Object.freeze({ buildKey: "orb-nod3d", path: ["src", "vfx", "presets", "orb-nod3d-default.js"], exportName: "ORB_NOD_3D_PRESET_DEFAULT" }),
      adapterFile: "orb-nod3d-authoring-adapter.js",
      authoringAdapter: createOrbNod3dAuthoringAdapter,
    }),
    "orb-spawn": Object.freeze({
      label: "Orb Spawn",
      category: "orb",
      panes: Object.freeze(["vfx"]),
      settingsKey: "orb-spawn",
      defaultSettingsKey: "orb-spawn",
      registryIds: Object.freeze(["orb.spawn"]),
      previewRootKey: "orbSpawnPreviewRoot",
      previewFile: "orb-spawn-preview.js",
      autoPreviewKey: "applyOrbSpawn",
      defaultBindTarget: "orb-state.spawn",
      livePreset: Object.freeze({ buildKey: "orb-spawn", path: ["src", "vfx", "presets", "orb-spawn-default.js"], exportName: "ORB_SPAWN_PRESET_DEFAULT" }),
      adapterFile: "orb-spawn-authoring-adapter.js",
      authoringAdapter: createOrbSpawnAuthoringAdapter,
    }),
    "orb-globe": Object.freeze({
      label: "Orb Globe",
      category: "orb",
      panes: Object.freeze(["vfx"]),
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
    "orb-globe-3d": Object.freeze({
      label: "Orb Globe 3D",
      category: "orb",
      panes: Object.freeze(["vfx"]),
      settingsKey: "orb-globe-3d",
      defaultSettingsKey: "orb-globe-3d",
      builtinOption: true,
      previewRootKey: "orbGlobe3dPreviewRoot",
      previewFile: "orb-globe-3d-preview.js",
      autoPreviewKey: "applyOrbGlobe3d",
      livePreset: Object.freeze({ buildKey: "orb-globe-3d", path: ["src", "game-runtime", "orb", "orb-globe-3d-default.js"], exportName: "ORB_GLOBE_3D_VISUAL_DEFAULTS" }),
      adapterFile: "orb-globe-3d-authoring-adapter.js",
      authoringAdapter: createOrbGlobe3dAuthoringAdapter,
    }),
    "orb-spin": Object.freeze({
      label: "Orb Spin",
      category: "orb",
      panes: Object.freeze(["vfx"]),
      settingsKey: "bank-orb-3d",
      defaultSettingsKey: "bank-orb-3d",
      registryIds: Object.freeze(["orb.spin"]),
      previewRootKey: "bankOrb3dPreviewRoot",
      previewFile: "bank-orb-3d-preview.js",
      autoPreviewKey: "applyBankOrb3d",
      defaultBindTarget: "orb-state.spin",
      publishNote: "Blank-orb stub lane for Orb Spin; visual design is pending.",
    }),
    "orb-lifecycle": Object.freeze({
      label: "Orb Lifecycle",
      category: "orb",
      panes: Object.freeze(["vfx"]),
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
    "orb-lifecycle-3d": Object.freeze({
      label: "Orb Lifecycle 3D",
      category: "orb",
      panes: Object.freeze(["vfx"]),
      settingsKey: "orb-lifecycle-3d",
      defaultSettingsKey: "orb-lifecycle-3d",
      builtinOption: true,
      previewRootKey: "orbLifecycle3dPreviewRoot",
      previewFile: "orb-lifecycle-3d-preview.js",
      autoPreviewKey: "applyOrbLifecycle3d",
      livePreset: Object.freeze({ buildKey: "orb-lifecycle-3d", path: ["src", "game-runtime", "orb", "orb-lifecycle-3d-default.js"], exportName: "ORB_LIFECYCLE_3D_DEFAULTS" }),
      adapterFile: "orb-lifecycle-3d-authoring-adapter.js",
      authoringAdapter: createOrbLifecycle3dAuthoringAdapter,
    }),
    "orb-shatter": Object.freeze({
      category: "orb",
      panes: Object.freeze(["vfx"]),
      settingsKey: "orb-shatter",
      defaultSettingsKey: "orb-shatter",
      registryIds: Object.freeze(["orb.shatter_voronoi"]),
      omitRegistryOption: true,
      defaultBindTarget: "orb-state.shattered",
      publishNote: "Runtime-only shatter effect; author shard/crack styling through Orb Lifecycle.",
    }),
    "world-globe": Object.freeze({
      category: "world",
      panes: Object.freeze(["vfx"]),
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
    "world-globe-3d": Object.freeze({
      label: "World Globe 3D",
      category: "world",
      panes: Object.freeze(["vfx"]),
      settingsKey: "world-globe-3d",
      defaultSettingsKey: "world-globe-3d",
      builtinOption: true,
      previewRootKey: "worldGlobe3dPreviewRoot",
      previewFile: "world-globe-3d-preview.js",
      autoPreviewKey: "applyWorldGlobe3d",
      livePreset: Object.freeze({ buildKey: "world-globe-3d", path: ["src", "game-runtime", "world", "world-globe-3d-default.js"], exportName: "WORLD_GLOBE_3D_VISUAL_DEFAULTS" }),
      adapterFile: "world-globe-3d-authoring-adapter.js",
      authoringAdapter: createWorldGlobe3dAuthoringAdapter,
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
  const publishContractsByBaseEffect = Object.freeze(
    Object.fromEntries(Object.entries(labEffectSurfaces).map(([baseEffect, surface]) => [
      baseEffect,
      Object.freeze({
        baseEffect,
        publishNote: surface.publishNote || "",
        livePreset: surface.livePreset
          ? Object.freeze({
              path: surface.livePreset.path,
              exportName: surface.livePreset.exportName,
            })
          : null,
        behavior: surface.behavior
          ? Object.freeze({
              path: surface.behavior.path,
              exportName: surface.behavior.exportName,
            })
          : null,
      }),
    ]))
  );

  return Object.freeze({
    studioBaseEffectByRegistryId: Object.freeze(
      Object.fromEntries(Object.entries(labEffectSurfaces).flatMap(([baseEffect, surface]) => (
        !surface.builtinOption && Array.isArray(surface.registryIds) ? surface.registryIds.map((registryId) => [String(registryId), baseEffect]) : []
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
    publishContractsByBaseEffect,
    behaviorBaseEffectByTargetId: Object.freeze(
      Object.fromEntries(Object.entries(labBehaviorSurfaces).flatMap(([baseEffect, surface]) => (
        Array.isArray(surface.targetIds) ? surface.targetIds.map((targetId) => [String(targetId).trim().toLowerCase(), baseEffect]) : []
      )))
    ),
  });
}
