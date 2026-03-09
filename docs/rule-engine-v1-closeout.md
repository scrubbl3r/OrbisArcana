# Rule Engine V1 Refactor Closeout

## Status
- Refactor target achieved: trigger/action behavior is authored from the master control schema and runtime-neutral contracts.
- Active spellbook role is narrowed to token availability/recognition metadata.
- Runtime rejects legacy school/class payload/intent aliases.

## Canonical Contract (Now)
- Intents:
  - `spell.axis_select`
  - `spell.wake_window_select`
- Payload fields:
  - `axisSpell`
  - `wakeWindowSpell`
- KWS expected-axis map:
  - `expectedAxisTokenByAxis`
- Axis AOE cast action:
  - `aoe_axis`

## Legacy Terms: Policy
- Blocked by validators/fail-fast:
  - `spell.school_select`
  - `spell.class_select`
  - routing keys `school`, `classKey`
  - cast action id `aoe_school`
  - handler key `play_school_aoe`
  - KWS config key `axisSpellByAxis`
- Allowed temporary fallback (non-legacy-domain):
  - frost visual fallback to flame when dedicated frost VFX is unavailable.

## Master-Control Quickstart
Use this pattern to author bespoke chains without adding hard wiring:

```js
{
  id: "rule_engine_v1",
  version: "v1",
  enabled: true,
  rules: [
    {
      id: "r_rota_y_spin_charged",
      on: {
        all: [
          { type: "SPELL", id: "ROTA" },
          { type: "GESTURE", id: "Y_SPIN" },
          { type: "ORB_STATE", id: "CHARGED" }
        ]
      },
      then: [
        {
          type: "WAKE_WIN",
          spells: ["sanctum", "vectus", "domus"],
          ttlMs: 2000
        },
        {
          type: "EVENT",
          id: "ELECTRIC_AOE"
          // optional per-instance overrides merge over defaults:
          // overrides: { ms: 900 }
        },
        {
          type: "EVENT",
          id: "GRACE",
          ms: 500
        }
      ]
    }
  ]
}
```

## Authoring Guidance
- Keep defaults in definitions; override only when behavior must diverge.
- Prefer adding/changing rules over adding branch logic in systems.
- Treat spell tokens/gestures/orb states as composable entities feeding `on` conditions.

## Final Gate
Run before major content edits:
- `validateSpellRuntimeRoutingV1()`
- `validateSpellSchemaIntegrityV1()`
- `validateRuleEngineV1Config()`
- receiver bootstrap import check
