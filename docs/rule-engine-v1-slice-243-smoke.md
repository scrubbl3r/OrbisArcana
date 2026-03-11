# Rule Engine V1 Slice 243 Smoke (Macro Doc Lock)

Goal
- Lock master schema doc to the implemented neutral contract.

Checks
- Open `docs/master-control-schema.md` and confirm the "Current Neutral Contract (Implemented)" section includes:
  - neutral intents only (`spell.axis_select`, `spell.wake_window_select`)
  - neutral payload fields only (`axisSpell`, `wakeWindowSpell`)
  - `axisSpellByAxis` KWS config naming
  - current dispatch reject reason set

Cleanup
- None.
