export const ORCHESTRATOR_V1_BOOTSTRAP = Object.freeze({
  // Stage 0 scaffold: keep disabled until compiler parity lands.
  useInReceiverBootstrap: false,
});

export const ORCHESTRATOR_V1 = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({}),
  rules: Object.freeze([
    // Minimal supported shape in early slices:
    // {
    //   id: "o_example",
    //   on: { spell: "orbis", gesture: "spin_y", orb_state: "charged" },
    //   open: { spells: ["domus", "electrum"], ttlMs: 2000 },
    //   trigger: [{ event: "teleport_home" }],
    // },
  ]),
});
