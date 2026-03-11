# Rule Engine V1 Slice 22 Smoke Checklist

## Purpose
- Harden derived signal schema with fail-fast duplicate signal ID validation.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver with current config.
- Confirm normal startup.

2) Duplicate-signal failure probe
- Temporarily add an overlap spell id between `WAKE_SPELL_IDS` and `CLASS_SPELL_IDS`.
- Restart receiver.
- Expect startup failure: `Rule Engine v1 schema validation failed` with `duplicate signal id`.
- Revert and confirm recovery.

3) Rule validation still works
- Keep unique signal IDs and restart.
- Confirm no rule schema validation errors.
