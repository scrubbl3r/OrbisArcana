// Canonical, human-friendly handles for interaction authoring.
// These are aliases/reference constants only (no runtime behavior by themselves).
// Docs index: docs/rule-engine-v2-docs-index.md

export const SIGNAL_HANDLES_V2 = Object.freeze({
  // Spells
  ORBIS: "spell.orbis",
  ARCANA: "spell.arcana",
  ARE_KAY_NAH: "spell.are_kay_nah",
  DOMUS: "spell.domus",
  PYRO: "spell.pyro",
  FRIDGIS: "spell.fridgis",
  ELECTRUM: "spell.electrum",
  SANCTUM: "spell.sanctum",
  VECTUS: "spell.vectus",
  ROTA: "spell.rota",

  // Flat spin gestures
  SPIN_X: "gesture.spin_x",
  SPIN_Y: "gesture.spin_y",
  SPIN_Z: "gesture.spin_z",

  // Shake gestures
  SHAKE_FB: "gesture.shake_fb",
  SHAKE_LR: "gesture.shake_lr",
  SHAKE_UD: "gesture.shake_ud",

  // Orb state signals
  ORB_CHARGED: "orb_state.charged",
  ORB_SUPERHEATED: "orb_state.superheated",
});

export const ACTION_HANDLES_V2 = Object.freeze({
  WAKE_WIN: "wake_win",
  EVENT: "event",
});

export const EVENT_HANDLES_V2 = Object.freeze({
  TELEPORT_HOME: "teleport_home",
  AOE_FLAME: "aoe_flame",
  AOE_FROST: "aoe_frost",
  AOE_ELECTRIC: "aoe_electric",
  GRACE: "grace",
  ORB_STATE: "orb_state",
  CAST_LOADED_UD: "cast_loaded_ud",
  CAST_LOADED_LR: "cast_loaded_lr",
  CAST_LOADED_FB: "cast_loaded_fb",
});
