// World-item schema (single bucket for pickups now; can split later)

export const WORLD_ITEMS = Object.freeze([
  {
    id: "globe_emitter_01",
    kind: "energy_globe_emitter",
    spawn: {
      xNorm: 0.5,
      yMode: "ground_center_offset",
      yValue: -1000,
      r: 25,
    },
    capacity: 1,
    regenTrigger: "globe_spent",
  },
  {
    id: "globe_emitter_02",
    kind: "energy_globe_emitter",
    spawn: {
      xNorm: 0.5,
      yMode: "absolute",
      yValue: 2000,
      r: 25,
    },
    capacity: 1,
    regenTrigger: "globe_spent",
  },
]);
