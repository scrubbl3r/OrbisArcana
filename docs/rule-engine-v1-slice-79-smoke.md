# Rule Engine V1 Slice 79 Smoke Checklist

## Purpose
- Add global dry-run control via `execution.executeActions`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default behavior sanity
- Keep `execution.executeActions: true` (default).
- Confirm actions execute as before.

3) Dry-run sanity
- Set `execution.executeActions: false`.
- Restart and trigger a matching rule.
- Confirm rule matching still occurs but action execution does not fire.

4) Validation sanity
- Set non-boolean value and confirm config fail-fast.
