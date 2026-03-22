const ORCHESTRATOR_V1_VERSION = "1";
const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const FIELD_KWS = "kws";
const FIELD_ROUTING = "routing";

export const ORCHESTRATOR_V1_BOOTSTRAP = Object.freeze({
  // Active bootstrap source for orchestrator-only runtime control.
  useInReceiverBootstrap: true,
  // Disable interactions projection fallback for orchestrator-exclusive mode.
  projectFromInteractionsWhenOrchestratorEmpty: false,
});

export const ORCHESTRATOR_V1 = Object.freeze({
  [FIELD_VERSION]: ORCHESTRATOR_V1_VERSION,
  [FIELD_ENABLED]: true,
  [FIELD_KWS]: Object.freeze({
    wakeWords: Object.freeze(["orbis"]),
    standaloneWords: Object.freeze(["arcana", "are_kay_nah"]),
    wakeRequiredWords: Object.freeze(["domus"]),
    axisWordsByAxis: Object.freeze({
      x: "fridgis",
      y: "pyro",
      z: "electrum",
    }),
    wakeWindowWords: Object.freeze(["rota", "sanctum", "vectus"]),
    rowTopWords: Object.freeze(["orbis", "arcana", "are_kay_nah", "domus", "fridgis", "pyro", "electrum"]),
    rowBottomWords: Object.freeze(["rota", "sanctum", "vectus"]),
    simWords: Object.freeze(["arcana", "are_kay_nah", "pyro", "rota", "electrum", "sanctum", "domus"]),
    inferDefaultWord: "pyro",
  }),
  [FIELD_ROUTING]: Object.freeze({
    words: Object.freeze([
      Object.freeze({
        id: "orbis",
        intent: "spell.wake",
      }),
      Object.freeze({
        id: "arcana",
        intent: "spell.arcana_test",
      }),
      Object.freeze({
        id: "are_kay_nah",
        intent: "spell.are_kay_nah_test",
      }),
      Object.freeze({
        id: "domus",
        intent: "spell.domus",
        allowedAxes: Object.freeze(["y"]),
        fixedSlot: "UD",
        slotByAxis: Object.freeze({ y: "UD" }),
        clearSlotsOnAxis: Object.freeze({ y: Object.freeze(["LR", "FB"]) }),
      }),
      Object.freeze({
        id: "pyro",
        intent: "spell.axis_select",
        axisWord: "pyro",
        axisSpell: "pyro",
        allowedAxes: Object.freeze(["y"]),
      }),
      Object.freeze({
        id: "fridgis",
        intent: "spell.axis_select",
        axisWord: "fridgis",
        axisSpell: "fridgis",
        allowedAxes: Object.freeze(["x"]),
      }),
      Object.freeze({
        id: "electrum",
        intent: "spell.axis_select",
        axisWord: "electrum",
        axisSpell: "electrum",
        allowedAxes: Object.freeze(["z"]),
      }),
      Object.freeze({
        id: "sanctum",
        intent: "spell.wake_window_select",
        wakeWindowSpell: "sanctum",
        fixedSlot: "UD",
        allowedAxes: Object.freeze(["x", "y", "z"]),
      }),
      Object.freeze({
        id: "vectus",
        intent: "spell.wake_window_select",
        wakeWindowSpell: "vectus",
        fixedSlot: "LR",
        allowedAxes: Object.freeze(["x", "y", "z"]),
      }),
      Object.freeze({
        id: "rota",
        intent: "spell.wake_window_select",
        wakeWindowSpell: "rota",
        fixedSlot: "FB",
        allowedAxes: Object.freeze(["x", "y", "z"]),
      }),
    ]),
  }),
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
