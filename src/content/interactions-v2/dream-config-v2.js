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
    wake_main_words: ["domus", "electrum", "pyro", "fridgis"],
    school_words: ["rota", "sanctum", "vectus"],
  },
  rules: [
    {
      id: "wake_main",
      on: { word: "orbis" },
      open: { id: "wake.main", words: ["domus", "electrum", "pyro", "fridgis"], ttlMs: 2000 },
      //open: { id: "wake.main", words: "@wake_main_words", ttlMs: 2000 },
    },
    {
      id: "tele_home",
      on: { word: "domus" },
      requires: "wake.main",
      trigger: { spell: "teleport_home" },
    },
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
    {
      id: "spin_y_opens_pyro",
      on: { gesture: "spin_y", orb_state: "charged" },
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
      bind: { spell: "aoe_flame", axisWord: "pyro", slot: "FB" },
    },
    {
      id: "school_fridgis",
      on: { word: "fridgis" },
      requires: "wake.main",
      open: { id: "school.fridgis", words: "@school_words", ttlMs: 2000 },
    },
    {
      id: "fridgis_rota_load_ud",
      on: { word: "rota" },
      requires: "school.fridgis",
      bind: { spell: "aoe_frost", axisWord: "fridgis", slot: "UD" },
    },
    {
      id: "fridgis_sanctum_load_lr",
      on: { word: "sanctum" },
      requires: "school.fridgis",
      bind: { spell: "aoe_frost", axisWord: "fridgis", slot: "LR" },
    },
    {
      id: "fridgis_vectus_load_fb",
      on: { word: "vectus" },
      requires: "school.fridgis",
      bind: { spell: "aoe_frost", axisWord: "fridgis", slot: "FB" },
    },
    {
      id: "electrum_sanctum_load_lr",
      on: { word: "sanctum" },
      requires: "school.electrum",
      bind: { spell: "aoe_electric", axisWord: "electrum", slot: "LR" },
    },
    {
      id: "electrum_vectus_load_fb",
      on: { word: "vectus" },
      requires: "school.electrum",
      bind: { spell: "aoe_electric", axisWord: "electrum", slot: "FB" },
    },
    {
      id: "shake_ud_cast",
      on: { gesture: "shake_ud" },
      trigger: { spell: "cast_loaded_ud" },
    },
    {
      id: "shake_lr_cast",
      on: { gesture: "shake_lr" },
      trigger: { spell: "cast_loaded_lr" },
    },
    {
      id: "shake_fb_cast",
      on: { gesture: "shake_fb" },
      trigger: { spell: "cast_loaded_fb" },
    },
  ],
};
