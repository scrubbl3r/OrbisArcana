export const ORCHESTRATOR_V1_BOOTSTRAP = Object.freeze({
  // Stage 0 scaffold: keep disabled until compiler parity lands.
  useInReceiverBootstrap: false,
});

export const ORCHESTRATOR_V1 = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({}),
  rules: Object.freeze([]),
});
