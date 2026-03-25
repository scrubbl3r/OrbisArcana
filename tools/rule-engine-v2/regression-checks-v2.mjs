// Ordered regression check manifest used by ready:v2 regression phase.
import { defineCheckEntriesV2 } from "./define-check-entries-v2.mjs";
// Keep this list minimal and behavior-focused; contracts live in separate manifest.
export const REGRESSION_CHECKS_V2 = defineCheckEntriesV2([
  {
    id: "tele_home_regression",
    script: "tools/rule-engine-v2/check-tele-home-regression-v2.mjs",
  },
  {
    id: "shake_regression",
    script: "tools/rule-engine-v2/check-shake-detonation-regression-v2.mjs",
  },
  {
    id: "wake_load_regression",
    script: "tools/rule-engine-v2/check-wake-window-load-regression-v2.mjs",
  },
  {
    id: "immediate_ownership",
    script: "tools/rule-engine-v2/check-immediate-dispatch-ownership-v2.mjs",
  },
  {
    id: "flat_spin_gating",
    script: "tools/rule-engine-v2/check-flat-spin-gating-regression-v2.mjs",
  },
  {
    id: "wake_window_axis_prereq",
    script: "tools/rule-engine-v2/check-wake-window-axis-prereq-regression-v2.mjs",
  },
  {
    id: "wake_sequence_regression",
    script: "tools/rule-engine-v2/check-wake-sequence-regression-v2.mjs",
  },
]);
