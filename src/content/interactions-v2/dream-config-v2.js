export const DREAM_CONFIG_V2 = {
  version: "2",
  enabled: true,
  defaults: {
    open: { ttlMs: 1250 },
    rule: { cooldownMs: 0, matchWindowMs: 2000, priority: 10 },
  },
  wake: {
    roots: [
      { id: "root.orbis", words: ["orbis"], ttlMs: 1250 },
      { id: "root.are_kay_nah", words: ["are_kay_nah"], ttlMs: 1250 },
    ],
  },
  groups: {
    wake_main_words: ["domus", "electrum", "pyro"],
    school_words: ["rota"],
    wake_are_kay_nah_words: ["pyro", "vectus"],
    pyro_school_words: ["sanctum", "rota"],
  },
  rules: [
    {
      id: "wake_main",
      on: { word: "orbis" },
      open: { id: "wake.main", words: ["domus", "electrum", "pyro"], ttlMs: 1250 },
      //open: { id: "wake.main", words: "@wake_main_words", ttlMs: 1250 },
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
      open: { id: "school.electrum", words: ["rota"], ttlMs: 1250 },
    },
    {
      id: "electric_aoe_cast",
      on: { word: "rota" },
      requires: "school.electrum",
      trigger: { spell: "aoe_electric" },
    },
    // ARE KAY NAH > VECTUS
    {
      id: "wake_are_kay_nah",
      on: { word: "are_kay_nah" },
      open: { id: "wake.are_kay_nah", words: ["pyro", "vectus"], ttlMs: 1250 },
    },
    {
      id: "pyro_school_voice",
      on: { word: "pyro" },
      requires: "wake.are_kay_nah",
      open: { id: "school.pyro_voice", words: ["sanctum", "rota"], ttlMs: 1250 },
    },
    {
      id: "pyro_sanctum_cast",
      on: { word: "sanctum" },
      requires: "school.pyro_voice",
      trigger: { spell: "sanctum_shield" },
    },
    {
      id: "pyro_rota_cast",
      on: { word: "rota" },
      requires: "school.pyro_voice",
      trigger: { spell: "aoe_flame" },
    },
    // PYRO AOE CHAIN
    {
      id: "spin_y_opens_pyro",
      on: { spin: "y" },
      open: { id: "school.pyro_spin_seed", words: ["pyro"], ttlMs: 1250 },
    },
    {
      id: "spin_y_pyro_opens_rota",
      on: { word: "pyro" },
      requires: "school.pyro_spin_seed",
      open: { id: "school.pyro_spin", words: ["rota"], ttlMs: 1250 },
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
      trigger: { spell: "shockwave" },
    },
    {
      id: "shake_lr_cast",
      on: { shake: "LR" },
      trigger: { spell: "shockwave" },
    },
    {
      id: "shake_fb_cast",
      on: { shake: "FB" },
      trigger: { spell: "shockwave" },
    },
  ],
};
