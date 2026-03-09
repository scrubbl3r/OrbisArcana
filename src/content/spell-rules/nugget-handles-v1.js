function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function asHandle(v) {
  return String(v || "").trim().toUpperCase();
}

const CONDITION_TYPE_ALIAS = Object.freeze({
  SPELL: "spell",
  GESTURE: "gesture",
  ORB_STATE: "orb_state",
  SIGNAL: "signal",
});

const ACTION_TYPE_ALIAS = Object.freeze({
  WAKE_WIN: "wake_win",
  EVENT: "event",
});

const SIGNAL_ID_ALIAS = Object.freeze({
  Y_SPIN: "gesture.y_spin",
  FSPIN_X: "gesture.fspin_x",
  FSPIN_Y: "gesture.fspin_y",
  FSPIN_Z: "gesture.fspin_z",
  UD_SHAKE: "gesture.ud_shake",
  LR_SHAKE: "gesture.lr_shake",
  FB_SHAKE: "gesture.fb_shake",
});

const EVENT_ID_ALIAS = Object.freeze({
  ELECTRIC_AOE: "electric_aoe",
  GRACE: "grace",
  ORB_STATE: "orb_state",
});

const WINDOW_ID_ALIAS = Object.freeze({
  WAKE_WIN: "wake_win",
});

export function normalizeConditionType(typeRaw) {
  const canonical = asId(typeRaw);
  if (canonical) return canonical;
  return asId(CONDITION_TYPE_ALIAS[asHandle(typeRaw)] || "");
}

export function normalizeActionType(typeRaw) {
  const canonical = asId(typeRaw);
  if (canonical) return canonical;
  return asId(ACTION_TYPE_ALIAS[asHandle(typeRaw)] || "");
}

export function normalizeSignalConditionId(condition = null) {
  const type = normalizeConditionType(condition && condition.type);
  const idRaw = String(condition && condition.id || "").trim();
  if (!idRaw) return "";
  if (type === "signal") {
    const aliased = SIGNAL_ID_ALIAS[asHandle(idRaw)];
    return asId(aliased || idRaw);
  }
  if (type === "spell" || type === "gesture" || type === "orb_state") {
    const aliased = SIGNAL_ID_ALIAS[asHandle(idRaw)];
    if (aliased) return asId(aliased);
    if (idRaw.includes(".")) return asId(idRaw);
    return `${type}.${asId(idRaw)}`;
  }
  return null;
}

export function normalizeWindowActionId(idRaw) {
  const id = String(idRaw || "").trim();
  const aliased = WINDOW_ID_ALIAS[asHandle(id)];
  return asId(aliased || id || "wake_win");
}

export function normalizeEventActionId(idRaw) {
  const id = String(idRaw || "").trim();
  const aliased = EVENT_ID_ALIAS[asHandle(id)];
  return asId(aliased || id);
}
