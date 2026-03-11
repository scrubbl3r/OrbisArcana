export const REGRESSION_CHECKS_V2 = Object.freeze([
  Object.freeze({
    id: "shake_regression",
    script: "tools/rule-engine-v2/check-shake-detonation-regression-v2.mjs",
  }),
  Object.freeze({
    id: "wake_load_regression",
    script: "tools/rule-engine-v2/check-wake-window-load-regression-v2.mjs",
  }),
  Object.freeze({
    id: "immediate_ownership",
    script: "tools/rule-engine-v2/check-immediate-dispatch-ownership-v2.mjs",
  }),
  Object.freeze({
    id: "flat_spin_gating",
    script: "tools/rule-engine-v2/check-flat-spin-gating-regression-v2.mjs",
  }),
  Object.freeze({
    id: "wake_window_axis_prereq",
    script: "tools/rule-engine-v2/check-wake-window-axis-prereq-regression-v2.mjs",
  }),
]);
