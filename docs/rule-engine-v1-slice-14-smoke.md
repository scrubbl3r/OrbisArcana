RULE ENGINE V1 - SLICE 14 SMOKE CHECKLIST

Purpose
- Remove remaining DOMUS-specific hardcoding from dispatch.
- Drive slot-lock and slot-clear behavior from routing config.

Quick Smoke (manual)
1) DOMUS Y-axis behavior
- Trigger DOMUS load on Y-axis flow.
- Confirm slot selection and slot clearing behavior still matches previous gameplay.

2) Config-driven behavior
- In `src/content/spells/spell-runtime-routing-v1.js`, temporarily edit:
  - `slotByAxis`
  - `clearSlotsOnAxis`
- Restart and confirm dispatch follows config change.
- Revert after test.

3) Hardcode audit
- Confirm `src/systems/spell-dispatch-system.js` has no spell-id-specific DOMUS branch.
