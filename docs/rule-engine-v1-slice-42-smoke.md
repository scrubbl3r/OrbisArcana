# RULE ENGINE V1 - SLICE 42 SMOKE CHECKLIST

## Purpose
- Add first-class `orb_state` event action support in master rule schema/bindings.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule schema sanity
- Confirm rule config validates with action:
  `{ type: "event", id: "orb_state", state: "superheated" }`.

3) Runtime action routing sanity
- With rule action execution enabled, trigger the rule.
- Confirm rule engine emits orb runtime event `orb.state_set` with `state` payload.

4) Regression sanity
- Confirm existing `grace` and `electric_aoe` actions still execute as before.
