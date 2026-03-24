export const DREAM_CONFIG_V2 = {
  version: "2",
  enabled: true,
  defaults: {
    open: { ttlMs: 1500 },
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
      open: { id: "wake.main", words: "@wake_main_words", ttlMs: 2000 },
    },
    {
      id: "tele_home",
      on: { word: "domus" },
      requires: "wake.main",
      trigger: { spell: "teleport_home" },
    },
    {
      id: "school_electrum",
      on: { word: "electrum" },
      requires: "wake.main",
      open: { id: "school.electrum", words: "@school_words", ttlMs: 1500 },
    },
    {
      id: "school_pyro",
      on: { word: "pyro" },
      requires: "wake.main",
      open: { id: "school.pyro", words: "@school_words", ttlMs: 1500 },
    },
    {
      id: "school_fridgis",
      on: { word: "fridgis" },
      requires: "wake.main",
      open: { id: "school.fridgis", words: "@school_words", ttlMs: 1500 },
    },
    {
      id: "spin_y_opens_pyro",
      on: { gesture: "spin_y" },
      open: { id: "school.pyro_spin", words: "@school_words", ttlMs: 1500 },
    },
    {
      id: "pyro_rota_load_ud",
      on: { word: "rota" },
      requires: "school.pyro",
      trigger: { spell: { id: "spell_load_ud", args: { spell: "aoe_flame", axisWord: "pyro", slot: "UD" } } },
    },
    {
      id: "pyro_sanctum_load_lr",
      on: { word: "sanctum" },
      requires: "school.pyro",
      trigger: { spell: { id: "spell_load_lr", args: { spell: "aoe_flame", axisWord: "pyro", slot: "LR" } } },
    },
    {
      id: "pyro_vectus_load_fb",
      on: { word: "vectus" },
      requires: "school.pyro",
      trigger: { spell: { id: "spell_load_fb", args: { spell: "aoe_flame", axisWord: "pyro", slot: "FB" } } },
    },
    {
      id: "pyro_rota_load_ud_spin",
      on: { word: "rota" },
      requires: "school.pyro_spin",
      trigger: { spell: { id: "spell_load_ud", args: { spell: "aoe_flame", axisWord: "pyro", slot: "UD" } } },
    },
    {
      id: "pyro_sanctum_load_lr_spin",
      on: { word: "sanctum" },
      requires: "school.pyro_spin",
      trigger: { spell: { id: "spell_load_lr", args: { spell: "aoe_flame", axisWord: "pyro", slot: "LR" } } },
    },
    {
      id: "pyro_vectus_load_fb_spin",
      on: { word: "vectus" },
      requires: "school.pyro_spin",
      trigger: { spell: { id: "spell_load_fb", args: { spell: "aoe_flame", axisWord: "pyro", slot: "FB" } } },
    },
    {
      id: "fridgis_rota_load_ud",
      on: { word: "rota" },
      requires: "school.fridgis",
      trigger: { spell: { id: "spell_load_ud", args: { spell: "aoe_frost", axisWord: "fridgis", slot: "UD" } } },
    },
    {
      id: "fridgis_sanctum_load_lr",
      on: { word: "sanctum" },
      requires: "school.fridgis",
      trigger: { spell: { id: "spell_load_lr", args: { spell: "aoe_frost", axisWord: "fridgis", slot: "LR" } } },
    },
    {
      id: "fridgis_vectus_load_fb",
      on: { word: "vectus" },
      requires: "school.fridgis",
      trigger: { spell: { id: "spell_load_fb", args: { spell: "aoe_frost", axisWord: "fridgis", slot: "FB" } } },
    },
    {
      id: "electrum_rota_load_ud",
      on: { word: "rota" },
      requires: "school.electrum",
      trigger: { spell: "aoe_electric" },
    },
    {
      id: "electrum_sanctum_load_lr",
      on: { word: "sanctum" },
      requires: "school.electrum",
      trigger: { spell: { id: "spell_load_lr", args: { spell: "aoe_electric", axisWord: "electrum", slot: "LR" } } },
    },
    {
      id: "electrum_vectus_load_fb",
      on: { word: "vectus" },
      requires: "school.electrum",
      trigger: { spell: { id: "spell_load_fb", args: { spell: "aoe_electric", axisWord: "electrum", slot: "FB" } } },
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
