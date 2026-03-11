# Rule Engine V1 Slice 18 Smoke Checklist

## Purpose
- Add fail-fast validation for spell runtime routing config.

## Quick Smoke (Manual)
1) Normal boot
- Start receiver with current config.
- Confirm normal startup.

2) Validation failure probe
- Temporarily break routing config (example: invalid slot `"XX"` in `fixedSlot` or unknown spell id in one of the id lists).
- Restart receiver.
- Expect startup failure with `Spell runtime routing validation failed`.
- Revert and confirm startup recovers.

3) Rule validation still active
- Confirm rule schema validation still runs after routing validation.
