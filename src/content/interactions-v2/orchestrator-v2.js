const ORCHESTRATOR_V2_VERSION = "2";
const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_GROUPS = "groups";
const FIELD_RULES = "rules";

export const ORCHESTRATOR_V2_BOOTSTRAP = Object.freeze({
  // Disabled until runtime adopts v2 windows/requires/consume semantics.
  useInReceiverBootstrap: false,
});

export const ORCHESTRATOR_V2 = Object.freeze({
  [FIELD_VERSION]: ORCHESTRATOR_V2_VERSION,
  [FIELD_ENABLED]: true,
  [FIELD_DEFAULTS]: Object.freeze({
    // open: { ttlMs: 1500 },
    // rule: { cooldownMs: 0, matchWindowMs: 2000, priority: 10 },
    // trigger: { grace: { ttlMs: 500 } },
  }),
  [FIELD_GROUPS]: Object.freeze({
    // wake_main_words: ["domus", "pyro", "fridgis", "electrum", "rota"],
  }),
  [FIELD_RULES]: Object.freeze([
    // {
    //   id: "master_wake_01",
    //   on: { word: "orbis" },
    //   open: { id: "wake.main", words: "@wake_main_words", ttlMs: 1500 },
    // },
  ]),
});
