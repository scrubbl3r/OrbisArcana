export const ORCHESTRATOR_V1_BOOTSTRAP = Object.freeze({
  // Stage 0 scaffold: keep disabled until compiler parity lands.
  useInReceiverBootstrap: false,
});

export const ORCHESTRATOR_V1 = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({
    // Optional defaults for OPEN/TRIGGER actions.
    // open: { ttlMs: 2000 },
    // trigger: { teleport_home: { style: "orb_flash_2" } },
  }),
  rules: Object.freeze([
    // Minimal supported shape in early slices:
    // {
    //   id: "o_example",
    //   on: { spell: ["orbis", "rota"], gesture: "spin_y", orb_state: "charged" },
    //   open: ["domus", "electrum"],
    //   trigger: ["teleport_home", { event: "grace", args: { ms: 700 } }],
    // },
  ]),
});
