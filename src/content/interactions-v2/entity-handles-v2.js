// Canonical, human-friendly handles for interaction authoring.
// These are aliases/reference constants only (no runtime behavior by themselves).

export const SIGNAL_HANDLES_V2 = Object.freeze({
  // Spells
  ORBIS: "spell.orbis",
  DOMUS: "spell.domus",
  PYRO: "spell.pyro",
  TEMPUS: "spell.pyro", // legacy alias during swap window
  FRIDGIS: "spell.fridgis",
  ELECTRUM: "spell.electrum",
  SANCTUM: "spell.sanctum",
  VECTUS: "spell.vectus",
  ROTA: "spell.rota",

  // Flat spin gestures
  FSPIN_X: "gesture.x_spin",
  FSPIN_Y: "gesture.y_spin",
  FSPIN_Z: "gesture.z_spin",
  Y_SPIN: "gesture.y_spin",

  // Shake gestures
  FB_SHAKE: "gesture.shake_fb",
  LR_SHAKE: "gesture.shake_lr",
  UD_SHAKE: "gesture.shake_ud",

  // Orb state signals
  ORB_CHARGED: "orb_state.charged",
  ORB_SUPERHEATED: "orb_state.superheated",
});

export const ACTION_HANDLES_V2 = Object.freeze({
  WAKE_WIN: "wake_win",
  EVENT: "event",
});

export const EVENT_HANDLES_V2 = Object.freeze({
  ELECTRIC_AOE: "electric_aoe",
  GRACE: "grace",
  ORB_STATE: "orb_state",
});
