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

  // Spin signals
  SPIN_X: "spin.x",
  SPIN_Y: "spin.y",
  SPIN_Z: "spin.z",

  // Shake signals
  SHAKE_FB: "shake.fb",
  SHAKE_LR: "shake.lr",
  SHAKE_UD: "shake.ud",

  // Orb state signals
  ORB_CHARGED: "orb_state.charged",
  ORB_GLOBE_LOADED: "orb_state.globe_loaded",
  ORB_SUPERHEATED: "orb_state.superheated",
});

export const ACTION_HANDLES_V2 = Object.freeze({
  WAKE_WIN: "wake_win",
  EVENT: "event",
});

export const EVENT_HANDLES_V2 = Object.freeze({
  TELEPORT: "teleport",
  SHOCKWAVE: "shockwave",
  AOE_FLAME: "aoe_flame",
  AOE_FROST: "aoe_frost",
  AOE_ELECTRIC: "aoe_electric",
  GRACE: "grace",
  ORB_STATE: "orb_state",
  CAST_LOADED_UD: "cast_loaded_ud",
  CAST_LOADED_LR: "cast_loaded_lr",
  CAST_LOADED_FB: "cast_loaded_fb",
});
