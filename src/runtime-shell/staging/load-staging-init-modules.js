function withVersion(path, version = "") {
  const v = String(version || "").trim();
  return v ? `${path}?v=${v}` : path;
}

/**
 * Load the staging/runtime bootstrap modules shared by the legacy receiver and
 * the new staging shell.
 */
export async function loadStagingInitModules(moduleCacheBustV = "") {
  const [
    receiverBootstrapModule,
    bootstrapKwsStagingModule,
    bootstrapGameStagingRuntimeModule,
    bootstrapStagingRuntimeContextModule,
    bindStagingRuntimeEventsModule,
    receiverEventsModule,
    kwsPanelControllerModule,
    kwsRuntimeControllerModule,
    kwsBootOrchestratorModule,
    kwsEventBindingsModule,
    kwsListenPolicyControllerModule,
    kwsProviderBootstrapModule,
    kwsConfigModule,
    kwsMvpCommandsModule,
    kwsReinitTeardownModule,
    kwsReceiverBridgeModule,
    vfxRuntimesBundleModule,
    orbRuntimeStateModule,
    orbRuntimeLoopModule,
  ] = await Promise.all([
    import(withVersion("../../runtime/receiver-bootstrap.js", moduleCacheBustV)),
    import("./bootstrap-kws-staging.js"),
    import("./bootstrap-game-staging-runtime.js"),
    import("./bootstrap-staging-runtime-context.js"),
    import("./bind-staging-runtime-events.js"),
    import("../../runtime/receiver-events.js"),
    import(withVersion("../../ui/dev-console/kws-panel-controller.js", moduleCacheBustV)),
    import("../../voice/kws/kws-runtime-controller.js"),
    import("../../voice/kws/kws-boot-orchestrator.js"),
    import(withVersion("../../voice/kws/kws-event-bindings.js", moduleCacheBustV)),
    import(withVersion("../../voice/kws/kws-listen-policy-controller.js", moduleCacheBustV)),
    import(withVersion("../../voice/kws/kws-provider-bootstrap.js", moduleCacheBustV)),
    import(withVersion("../../voice/kws/kws-config.js", moduleCacheBustV)),
    import("../../voice/kws/kws-mvp-commands.js"),
    import("../../voice/kws/kws-reinit-teardown.js"),
    import("../../voice/kws/kws-receiver-bridge.js"),
    import("../../vfx/effects/vfx-runtimes-bundle.js"),
    import("../../game-runtime/orb/orb-runtime-state.js"),
    import("../../game-runtime/orb/orb-runtime-loop.js"),
  ]);

  return {
    receiverBootstrapModule,
    bootstrapKwsStagingModule,
    bootstrapGameStagingRuntimeModule,
    bootstrapStagingRuntimeContextModule,
    bindStagingRuntimeEventsModule,
    receiverEventsModule,
    kwsPanelControllerModule,
    kwsRuntimeControllerModule,
    kwsBootOrchestratorModule,
    kwsEventBindingsModule,
    kwsListenPolicyControllerModule,
    kwsProviderBootstrapModule,
    kwsConfigModule,
    kwsMvpCommandsModule,
    kwsReinitTeardownModule,
    kwsReceiverBridgeModule,
    vfxRuntimesBundleModule,
    orbRuntimeStateModule,
    orbRuntimeLoopModule,
  };
}
