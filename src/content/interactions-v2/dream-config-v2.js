export const DREAM_CONFIG_V2 = {
  version: "2",
  enabled: true,
  defaults: {
    open: { ttlMs: 2000 },
    rule: { cooldownMs: 0, matchWindowMs: 2000, priority: 10 },
  },
  wake: {
    roots: [
      { id: "root.orbis", words: ["orbis"], ttlMs: 2000 },
      { id: "root.are_kay_nah", words: ["are_kay_nah"], ttlMs: 2000 },
    ],
  },
  groups: {
    wake_main_words: ["domus", "electrum", "pyro"],
    school_words: ["rota"],
  },
  rules: [
    {
      id: "wake_main",
      on: { word: ["orbis", "are_kay_nah"] },
      open: { id: "wake.main", words: ["domus", "electrum", "pyro"], ttlMs: 2000 },
      //open: { id: "wake.main", words: "@wake_main_words", ttlMs: 2000 },
    },
    // TELEPORT HOME
    {
      id: "tele_home",
      on: { word: "domus" },
      requires: "wake.main",
      trigger: { spell: "teleport_home" },
    },
    // ELECTRIC AOE CHAIN
    {
      id: "electric_aoe",
      on: { word: "electrum" },
      requires: "wake.main",
      open: { id: "school.electrum", words: ["rota"], ttlMs: 2000 },
    },
    {
      id: "electric_aoe_cast",
      on: { word: "rota" },
      requires: "school.electrum",
      trigger: { spell: "aoe_electric" },
    },
    // PYRO AOE CHAIN
    {
      id: "spin_y_opens_pyro",
      on: { spin: "y", orb_state: "charged" },
      open: { id: "school.pyro_spin_seed", words: ["pyro"], ttlMs: 2000 },
    },
    {
      id: "spin_y_pyro_opens_rota",
      on: { word: "pyro" },
      requires: "school.pyro_spin_seed",
      open: { id: "school.pyro_spin", words: ["rota"], ttlMs: 2000 },
    },
    {
      id: "spin_y_pyro_rota_bind_fb",
      on: { word: "rota" },
      requires: "school.pyro_spin",
      bind: { spell: "aoe_flame", slot: "FB" },
    },
    // SHOCKWAVE
    {
      id: "shake_ud_cast",
      on: { shake: "UD" },
      trigger: { spell: "cast_loaded_ud" },
    },
    {
      id: "shake_lr_cast",
      on: { shake: "LR" },
      trigger: { spell: "cast_loaded_lr" },
    },
    {
      id: "shake_fb_cast",
      on: { shake: "FB" },
      trigger: { spell: "cast_loaded_fb" },
    },
  ],
};
