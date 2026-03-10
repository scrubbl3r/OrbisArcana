// Runtime execution bindings for Rule Engine v1 event actions.
// Keeps rule action ids decoupled from concrete receiver execution paths.

export const EVENT_RUNTIME_BINDINGS_V1 = Object.freeze([
  Object.freeze({
    id: "grace",
    runtime: Object.freeze({
      kind: "orb_event",
      event: "orb.float_grace_grant",
    }),
  }),
  Object.freeze({
    id: "electric_aoe",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "aoe_electric",
    }),
  }),
  Object.freeze({
    id: "flame_aoe",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "aoe_flame",
    }),
  }),
  Object.freeze({
    id: "frost_aoe",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "aoe_frost",
    }),
  }),
  Object.freeze({
    id: "domus_teleport",
    runtime: Object.freeze({
      kind: "cast_action",
      castActionId: "domus_teleport",
    }),
  }),
  Object.freeze({
    id: "orb_state",
    runtime: Object.freeze({
      kind: "orb_event",
      event: "orb.state_set",
    }),
  }),
]);

export const EVENT_RUNTIME_BINDINGS_V1_BY_ID = Object.freeze(
  EVENT_RUNTIME_BINDINGS_V1.reduce((acc, item) => {
    const id = String(item && item.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, {})
);
