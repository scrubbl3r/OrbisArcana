# Rule Engine V1 Slice 240 Smoke (Macro Terminology)

Goal
- Complete neutral terminology cut in dispatch internals.
- Replace remaining class/school wording in runtime reject codes and variable paths.

Checks
- Trigger non-axis/non-wake-window token in flat-spin mode:
  - Confirm reject reason is `flat_spin_requires_wake_window_token`.
- Trigger wake-window token before axis token:
  - Confirm reject reason is `no_axis_selected`.
- Trigger invalid wake-window resolution case:
  - Confirm reject reason is `axis_wake_window_resolution_failed`.

Cleanup
- None.
