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
      { id: "root.echovar", words: ["echovar"], ttlMs: 1500 },
      { id: "root.sanctum", words: ["sanctum"], ttlMs: 1500 },
      { id: "root.modula", words: ["modula"], ttlMs: 1500 },
      { id: "root.salubrium", words: ["salubrium"], ttlMs: 1500 },
      { id: "root.leviton", words: ["leviton"], ttlMs: 1500 },
      { id: "root.electrum", words: ["electrum"], ttlMs: 1500 },
    ],
  },
  groups: {
    wake_main_words: ["electrum"],
  },
  rules: [
    {
      id: "wake_main",
      on: { word: "orbis" },
      open: { id: "wake.main", words: ["electrum"], ttlMs: 1500 },
      //open: { id: "wake.main", words: "@wake_main_words", ttlMs: 1500 },
    },
    // BUBBLE SHIELD
    {
      id: "orbis_sanctum_cast",
      on: { word: "sanctum" },
      trigger: { spell: "bubble_shield" },
      grace: {},
    },
    // TELEPORT HOME
    {
      id: "tele_home",
      on: { word: "echovar" },
      trigger: { spell: "teleport" },
      grace: { ttlMs: 5000 },
    },
    // FLOAT
    {
      id: "orbis_leviton_cast",
      on: { word: "leviton" },
      trigger: { spell: "float" },
      grace: {},
    },
    // ORB SPIN ABILITY WINDOW
    {
      id: "orbis_modula_orb_spin",
      on: { word: "modula" },
      trigger: { spell: "orb_spin" },
      grace: {},
    },
    // HEAL
    {
      id: "orbis_salubrium_heal_cast",
      on: { word: "salubrium" },
      trigger: { spell: "heal" },
    },
    // TESLA 1
    {
      id: "electrum_cast_tesla_1",
      on: { word: "electrum" },
      trigger: { spell: "tesla_1" },
      grace: {},
    },
    // PYRO AOE CHAIN
    {
      id: "spin_y_opens_pyro",
      on: { spin: "y" },
      open: { id: "chain.spin_y_seed", words: ["pyro"], ttlMs: 1500 },
    },
    {
      id: "spin_y_pyro_bind_flame_aoe_fb",
      on: { word: "pyro" },
      requires: "chain.spin_y_seed",
      bind: { spell: "aoe_flame", slot: "FB" },
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
