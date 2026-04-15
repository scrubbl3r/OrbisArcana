export const INTERACTION_GRAPH_V2 = {
  version: "2",
  enabled: true,
  defaults: {
    open: { ttlMs: 1500 },
    rule: { cooldownMs: 0, matchWindowMs: 2000, priority: 10 },
  },
  wake: {
    roots: [
      { id: "root.orbis", words: ["orbis"], ttlMs: 1500 },
      { id: "root.are_kay_nah", words: ["are_kay_nah"], ttlMs: 1500 },
    ],
  },
  groups: {
    wake_main_words: ["domus", "electrum", "pyro"],
    electrum_chain_words: ["rota"],
    wake_are_kay_nah_words: ["pyro", "vectus"],
    pyro_voice_chain_words: ["sanctum", "rota"],
  },
  rules: [
    {
      id: "wake_main",
      on: { word: "orbis" },
      open: { id: "wake.main", words: ["domus", "electrum", "pyro"], ttlMs: 1500 },
      //open: { id: "wake.main", words: "@wake_main_words", ttlMs: 1500 },
    },
    // TELEPORT HOME
    {
      id: "tele_home",
      on: { word: "domus" },
      requires: "wake.main",
      trigger: { spell: "teleport" },
      grace: { ttlMs: 5000 },
    },
    // ELECTRIC AOE CHAIN
    {
      id: "electric_aoe",
      on: { word: "electrum" },
      requires: "wake.main",
      open: { id: "chain.electrum", words: ["rota"], ttlMs: 1500 },
    },
    {
      id: "electric_aoe_cast",
      on: { word: "rota" },
      requires: "chain.electrum",
      trigger: { spell: "aoe_electric" },
      grace: {},
    },
    // ARE KAY NAH > VECTUS
    {
      id: "wake_are_kay_nah",
      on: { word: "are_kay_nah" },
      open: { id: "wake.are_kay_nah", words: ["pyro", "vectus"], ttlMs: 1500 },
    },
    {
      id: "pyro_voice_chain",
      on: { word: "pyro" },
      requires: "wake.are_kay_nah",
      open: { id: "chain.pyro_voice", words: ["sanctum", "rota"], ttlMs: 1500 },
    },
    {
      id: "pyro_sanctum_cast",
      on: { word: "sanctum" },
      requires: "chain.pyro_voice",
      trigger: { spell: "bubble_shield" },
      grace: {},
    },
    {
      id: "pyro_rota_cast",
      on: { word: "rota" },
      requires: "chain.pyro_voice",
      trigger: { spell: "aoe_flame" },
      grace: {},
    },
    // PYRO AOE CHAIN
    {
      id: "spin_y_opens_pyro",
      on: { spin: "y" },
      open: { id: "chain.spin_y_seed", words: ["pyro"], ttlMs: 1500 },
    },
    {
      id: "spin_y_pyro_opens_vectus",
      on: { word: "pyro" },
      requires: "chain.spin_y_seed",
      open: { id: "chain.spin_y_loaded", words: ["vectus"], ttlMs: 1500 },
    },
    {
      id: "spin_y_pyro_vectus_bind_fb",
      on: { word: "vectus" },
      requires: "chain.spin_y_loaded",
      bind: { spell: "bubble_shield", slot: "FB" },
    },
    // SHOCKWAVE
    {
      id: "shake_ud_cast",
      on: { shake: "UD" },
      trigger: { spell: "cast_loaded_ud" },
      grace: {},
    },
    {
      id: "shake_lr_cast",
      on: { shake: "LR" },
      trigger: { spell: "cast_loaded_lr" },
      grace: {},
    },
    {
      id: "shake_fb_cast",
      on: { shake: "FB" },
      trigger: { spell: "cast_loaded_fb" },
      grace: {},
    },
  ],
};
