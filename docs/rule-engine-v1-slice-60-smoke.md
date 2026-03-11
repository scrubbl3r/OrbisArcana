# Rule Engine V1 Slice 60 Smoke Checklist

## Purpose
- Add global cooldown scaling via `execution.cooldownScale` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default behavior sanity
- Keep `execution.cooldownScale: 1` (default).
- Confirm cooldown behavior remains unchanged.

3) Faster cooldown sanity
- Set `execution.cooldownScale: 0.5`.
- Restart and confirm rule cooldowns feel shorter.

4) Disable cooldown sanity
- Set `execution.cooldownScale: 0`.
- Restart and confirm repeated triggers are no longer blocked by cooldown.

5) Slower cooldown sanity
- Set `execution.cooldownScale: 2`.
- Restart and confirm cooldown spacing increases.

6) Validation sanity
- Set `execution.cooldownScale` to a negative or non-numeric value and confirm config fail-fast.
