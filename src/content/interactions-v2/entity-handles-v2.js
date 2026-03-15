// Canonical, human-friendly handles for interaction authoring.
// These are aliases/reference constants only (no runtime behavior by themselves).
// Docs index: docs/rule-engine-v2-docs-index.md

export const SIGNAL_HANDLES_V2 = Object.freeze({
  // Spells
  ORBIS: "spell.orbis",
  DOMUS: "spell.domus",
  PYRO: "spell.pyro",
  FRIDGIS: "spell.fridgis",
  ELECTRUM: "spell.electrum",
  SANCTUM: "spell.sanctum",
  VECTUS: "spell.vectus",
  ROTA: "spell.rota",

  // Flat spin gestures
  SPIN_X: "gesture.x_spin",
  SPIN_Y: "gesture.y_spin",
  SPIN_Z: "gesture.z_spin",

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
  DOMUS_TELEPORT: "domus_teleport",
  FLAME_AOE: "flame_aoe",
  FROST_AOE: "frost_aoe",
  ELECTRIC_AOE: "electric_aoe",
  GRACE: "grace",
  ORB_STATE: "orb_state",
});
