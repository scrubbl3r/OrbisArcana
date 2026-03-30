// Runtime execution bindings for rule-engine event actions.
// Keeps rule action ids decoupled from concrete receiver execution paths.

export const EVENT_RUNTIME_BINDINGS = Object.freeze([
  Object.freeze({
    id: "grace",
    runtime: Object.freeze({
      kind: "orb_event",
      event: "orb.float_grace_grant",
    }),
  }),
  Object.freeze({
    id: "aoe_electric",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "aoe_electric",
    }),
  }),
  Object.freeze({
    id: "aoe_flame",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "aoe_flame",
    }),
  }),
  Object.freeze({
    id: "aoe_frost",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "aoe_frost",
    }),
  }),
  Object.freeze({
    id: "teleport",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "teleport",
    }),
  }),
  Object.freeze({
    id: "shockwave",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "shockwave",
    }),
  }),
  Object.freeze({
    id: "bubble_shield",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "bubble_shield",
    }),
  }),
  Object.freeze({
    id: "colorize",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "colorize",
    }),
  }),
  Object.freeze({
    id: "orb_state",
    runtime: Object.freeze({
      kind: "orb_event",
      event: "orb.state_set",
    }),
  }),
  Object.freeze({
    id: "cast_loaded_ud",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "cast_loaded_ud",
    }),
  }),
  Object.freeze({
    id: "cast_loaded_lr",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "cast_loaded_lr",
    }),
  }),
  Object.freeze({
    id: "cast_loaded_fb",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "cast_loaded_fb",
    }),
  }),
]);

export const EVENT_RUNTIME_BINDINGS_BY_ID = Object.freeze(
  EVENT_RUNTIME_BINDINGS.reduce((acc, item) => {
    const id = String(item && item.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, {})
);
