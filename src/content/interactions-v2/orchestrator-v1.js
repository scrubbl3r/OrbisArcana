const ORCHESTRATOR_V1_VERSION = "1";
const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";

export const ORCHESTRATOR_V1_BOOTSTRAP = Object.freeze({
  // Stage 0 scaffold: keep disabled until compiler parity lands.
  useInReceiverBootstrap: true,
  // When bootstrap is enabled and ORCHESTRATOR_V1 has no rules yet,
  // project from INTERACTIONS_V2 as a safe bridge.
  projectFromInteractionsWhenOrchestratorEmpty: true,
});

export const ORCHESTRATOR_V1 = Object.freeze({
  [FIELD_VERSION]: ORCHESTRATOR_V1_VERSION,
  [FIELD_ENABLED]: true,
  [FIELD_DEFAULTS]: Object.freeze({
    // Optional defaults for OPEN/TRIGGER actions.
    // open: { ttlMs: 2000 },
    // trigger: { teleport_home: { style: "orb_flash_2" } },
    // rule: { cooldownMs: 250, matchWindowMs: 2200, priority: 10 },
  }),
  [FIELD_RULES]: Object.freeze([
    // Minimal supported shape in early slices:
    // {
    //   id: "o_example",
    //   on: { spell: ["orbis", "rota"], gesture: "spin_y", orb_state: "charged" },
    //   cooldownMs: 250,
    //   matchWindowMs: 2200,
    //   open: ["domus", "electrum"],
    //   trigger: { teleport_home: true, grace: { ms: 700 } },
    // },
    {
      id: "001_hello_world",
      on: { spell: "orbis" },
      trigger: {
        teleport_home: true,
        grace: { ms: 1000 },
      },
    },
  ]),
});
