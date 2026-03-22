const ORCHESTRATOR_V1_VERSION = "1";
const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";

export const ORCHESTRATOR_V1_BOOTSTRAP = Object.freeze({
  // Active bootstrap source for orchestrator-only runtime control.
  useInReceiverBootstrap: true,
  // Disable interactions projection fallback for orchestrator-exclusive mode.
  projectFromInteractionsWhenOrchestratorEmpty: false,
});

export const ORCHESTRATOR_V1 = Object.freeze({
  [FIELD_VERSION]: ORCHESTRATOR_V1_VERSION,
  [FIELD_ENABLED]: true,
  [FIELD_DEFAULTS]: Object.freeze({
    open: { ttlMs: 2000 },
    trigger: { grace: { ms: 500 } },
  }),
  [FIELD_RULES]: Object.freeze([
    {
      id: "r_fridgis_immediate",
      on: { word: "fridgis" },
      trigger: {
        aoe_frost: true,
      },
    },
    {
      id: "r_electrum_immediate",
      on: { word: "electrum" },
      trigger: {
        aoe_electric: true,
      },
    },
    {
      id: "r_pyro_immediate",
      on: { word: "pyro" },
      trigger: {
        aoe_flame: true,
      },
    },
    {
      id: "r_domus_immediate",
      on: { word: "domus" },
      trigger: {
        teleport_home: true,
      },
    },
    {
      id: "r_rota_yspin_charged",
      on: {
        word: "rota",
        gesture: "spin_y",
        orb_state: "charged",
      },
      open: ["rota", "sanctum", "vectus"],
      trigger: {
        aoe_electric: { range: 14 },
        grace: true,
        orb_state: { state: "superheated" },
      },
    },
  ]),
});
